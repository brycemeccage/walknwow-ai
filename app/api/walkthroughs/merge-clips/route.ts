import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type MergeClipsRequest = {
  clips?: unknown;
};

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath =
      process.env.FFMPEG_PATH?.trim() || "ffmpeg";

    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error: Error) => {
      reject(error);
    });

    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          stderr.trim() ||
            `FFmpeg exited with code ${code ?? "unknown"}.`
        )
      );
    });
  });
}

function getValidClipUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validUrls: string[] = [];

  for (const item of value) {
    if (
      typeof item === "string" &&
      /^https?:\/\//i.test(item.trim())
    ) {
      validUrls.push(item.trim());
    }
  }

  return validUrls.slice(0, 30);
}

async function downloadClip(
  clipUrl: string,
  outputPath: string
): Promise<void> {
  const response = await fetch(clipUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `Could not download a Runway clip. Status ${response.status}.`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  if (buffer.length === 0) {
    throw new Error("A downloaded Runway clip was empty.");
  }

  await writeFile(outputPath, buffer);
}

async function normalizeClip(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await runFFmpeg([
    "-y",
    "-ss",
    "0.8",
    "-i",
    inputPath,
    "-t",
    "4.0",
    "-vf",
    [
      "scale=1280:720:force_original_aspect_ratio=decrease",
      "pad=1280:720:(ow-iw)/2:(oh-ih)/2",
      "fps=30",
      "format=yuv420p",
    ].join(","),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

async function mergeClips(
  normalizedPaths: string[],
  outputPath: string,
  tempDirectory: string
): Promise<void> {
  const listPath = path.join(
    tempDirectory,
    "concat-list.txt"
  );

  const lines: string[] = [];

  for (const clipPath of normalizedPaths) {
    const safePath = clipPath.replaceAll(
      "'",
      "'\\''"
    );

    lines.push(`file '${safePath}'`);
  }

  await writeFile(
    listPath,
    lines.join("\n"),
    "utf8"
  );

  await runFFmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

export async function POST(request: Request) {
  const jobId = randomUUID();

  const tempDirectory = path.join(
    process.cwd(),
    ".walknwow-temp",
    jobId
  );

  const outputDirectory = path.join(
    process.cwd(),
    "public",
    "generated"
  );

  const filename = `walkthrough-${jobId}.mp4`;

  const outputPath = path.join(
    outputDirectory,
    filename
  );

  try {
    const body =
      (await request.json()) as MergeClipsRequest;

    const clipUrls = getValidClipUrls(body.clips);

    if (clipUrls.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least two valid Runway clip URLs are required.",
        },
        { status: 400 }
      );
    }

    await mkdir(tempDirectory, {
      recursive: true,
    });

    await mkdir(outputDirectory, {
      recursive: true,
    });

    const normalizedPaths: string[] = [];

    for (
      let index = 0;
      index < clipUrls.length;
      index += 1
    ) {
      const number = String(index + 1).padStart(
        2,
        "0"
      );

      const downloadedPath = path.join(
        tempDirectory,
        `downloaded-${number}.mp4`
      );

      const normalizedPath = path.join(
        tempDirectory,
        `normalized-${number}.mp4`
      );

      await downloadClip(
        clipUrls[index],
        downloadedPath
      );

      await normalizeClip(
        downloadedPath,
        normalizedPath
      );

      normalizedPaths.push(normalizedPath);
    }

    await mergeClips(
      normalizedPaths,
      outputPath,
      tempDirectory
    );

    const finalVideo = await readFile(outputPath);

    if (finalVideo.length === 0) {
      throw new Error(
        "FFmpeg created an empty walkthrough video."
      );
    }

    return NextResponse.json({
      success: true,
      clipCount: clipUrls.length,
      filename,
      videoUrl: `/generated/${filename}`,
    });
  } catch (error) {
    console.error("Merge clips error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The walkthrough could not be merged.",
      },
      { status: 500 }
    );
  } finally {
    await rm(tempDirectory, {
      recursive: true,
      force: true,
    }).catch(() => undefined);
  }
}