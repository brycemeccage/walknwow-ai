import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";
import ffmpegStatic from "ffmpeg-static";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type MusicProfile =
  | "luxury-cinematic"
  | "modern-minimal"
  | "warm-elegant"
  | "coastal-airy"
  | "rustic-organic"
  | "urban-contemporary"
  | "bright-lifestyle"
  | "dramatic-estate";

type PropertyDNA = {
  propertyType?: unknown;
  architecturalStyle?: unknown;
  luxuryLevel?: unknown;
  standoutFeatures?: unknown;
  exterior?: unknown;
  interior?: unknown;
  outdoor?: unknown;
};

type MergeClipsRequest = {
  clips?: unknown;
  propertyDNA?: unknown;
  musicProfile?: unknown;
};

const CLIP_DURATION = 4.0;
const FADE_DURATION = 0.30;
const MUSIC_VOLUME = 0.18;
const MUSIC_FADE_IN = 1.2;
const MUSIC_FADE_OUT = 1.5;

const MUSIC_LIBRARY: Record<MusicProfile, string[]> = {
  "luxury-cinematic": [
    "bombinsound-luxury-514144.mp3",
    "paulyudin-luxury-luxury-music-573998.mp3",
  ],
  "modern-minimal": [
    "kulakovka-minimal-electronica-274978.mp3",
    "solarflex-minimal-569584.mp3",
  ],
  "warm-elegant": [
    "tadashikeiji-love-at-first-shot-344295.mp3",
  ],
  "coastal-airy": [
    "audiocoffee-airy-motivational-background-119331.mp3",
    "u_98673jp944-lisbon-coastal-soul-478006.mp3",
  ],
  "rustic-organic": [
    "the_mountain-country-567416.mp3",
  ],
  "urban-contemporary": [
    "soundsurfer-urban-516374.mp3",
    "soundsurfer-urban-fashion-262402.mp3",
  ],
  "bright-lifestyle": [
    "prettyjohn1-lifestyle-500587.mp3",
    "tunetank-lifestyle-vlog-beat-349647.mp3",
  ],
  "dramatic-estate": [
    "atlasaudio-real-estate-real-estate-music-576653.mp3",
    "prettyjohn1-real-estate-background-luxury-music-504590.mp3",
  ],
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function facts(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}).toLowerCase();
  } catch {
    return "";
  }
}

function isProfile(value: unknown): value is MusicProfile {
  return [
    "luxury-cinematic",
    "modern-minimal",
    "warm-elegant",
    "coastal-airy",
    "rustic-organic",
    "urban-contemporary",
    "bright-lifestyle",
    "dramatic-estate",
  ].includes(String(value));
}

function chooseProfile(dna: PropertyDNA): MusicProfile {
  const luxury = text(dna.luxuryLevel).toLowerCase();
  const all = `${text(dna.propertyType)} ${text(dna.architecturalStyle)} ${luxury} ${facts(dna)}`.toLowerCase();

  if (/ocean|beach|coast|waterfront|bay|lake|dock|marina/.test(all)) return "coastal-airy";
  if (/farmhouse|rustic|cabin|mountain|country|ranch|timber/.test(all)) return "rustic-organic";
  if (/loft|condo|apartment|penthouse|urban|city|industrial/.test(all)) return "urban-contemporary";
  if (/mansion|estate|manor|chateau|grand/.test(all)) return "dramatic-estate";
  if (/modern|contemporary|minimal|mid-century|glass|concrete/.test(all)) {
    return /luxury|high-end|premium|ultra/.test(luxury)
      ? "luxury-cinematic"
      : "modern-minimal";
  }
  if (/luxury|high-end|premium|custom/.test(all)) return "luxury-cinematic";
  if (/traditional|transitional|craftsman|colonial|tudor|victorian|mediterranean|spanish/.test(all)) return "warm-elegant";
  return "bright-lifestyle";
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = process.env.FFMPEG_PATH?.trim() || ffmpegStatic || "ffmpeg";
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) return resolve();
      reject(new Error(stderr.trim() || `FFmpeg exited with code ${code ?? "unknown"}.`));
    });
  });
}

function validClips(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item.trim()))
    .map((item) => item.trim())
    .slice(0, 30);
}

async function downloadFile(url: string, outputPath: string, label: string): Promise<void> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(120000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Could not download ${label}. Status ${response.status}.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error(`Downloaded ${label} was empty.`);
  await writeFile(outputPath, buffer);
}

async function normalizeClip(inputPath: string, outputPath: string, index: number, total: number): Promise<void> {
  const filters = [
    "scale=1280:720:force_original_aspect_ratio=decrease",
    "pad=1280:720:(ow-iw)/2:(oh-ih)/2",
    "fps=30",
    "format=yuv420p",
  ];
  if (index > 0) filters.push(`fade=t=in:st=0:d=${FADE_DURATION}:color=black`);
  if (index < total - 1) filters.push(`fade=t=out:st=${CLIP_DURATION - FADE_DURATION}:d=${FADE_DURATION}:color=black`);

  await runFFmpeg([
    "-y", "-ss", "0.8", "-i", inputPath, "-t", String(CLIP_DURATION),
    "-vf", filters.join(","), "-an", "-r", "30", "-c:v", "libx264",
    "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", outputPath,
  ]);
}

async function concatClips(paths: string[], outputPath: string, tempDirectory: string): Promise<void> {
  const listPath = path.join(tempDirectory, "concat-list.txt");
  const lines = paths.map((clipPath) => `file '${clipPath.replaceAll("'", "'\\''")}'`);
  await writeFile(listPath, lines.join("\n"), "utf8");
  await runFFmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", "-movflags", "+faststart", outputPath]);
}

async function addMusic(videoPath: string, musicPath: string, outputPath: string, totalDuration: number): Promise<void> {
  const fadeOutStart = Math.max(0, totalDuration - MUSIC_FADE_OUT);
  const filter = [
    `volume=${MUSIC_VOLUME}`,
    `afade=t=in:st=0:d=${MUSIC_FADE_IN}`,
    `afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${MUSIC_FADE_OUT}`,
  ].join(",");

  await runFFmpeg([
    "-y", "-i", videoPath, "-stream_loop", "-1", "-i", musicPath,
    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac",
    "-b:a", "192k", "-af", filter, "-t", totalDuration.toFixed(2),
    "-movflags", "+faststart", outputPath,
  ]);
}

export async function POST(request: Request) {
  const jobId = randomUUID();
  const tempDirectory = path.join("/tmp", "walknwow-temp", jobId);
  const filename = `walkthrough-${jobId}.mp4`;
  const silentPath = path.join(tempDirectory, `silent-${filename}`);
  const finalPath = path.join(tempDirectory, filename);
  const musicPath = path.join(tempDirectory, "music.mp3");

  try {
    const body = (await request.json()) as MergeClipsRequest;
    const clips = validClips(body.clips);
    if (clips.length < 2) {
      return NextResponse.json({ success: false, message: "At least two valid Runway clip URLs are required." }, { status: 400 });
    }

    const dna =
      typeof body.propertyDNA === "object" && body.propertyDNA !== null
        ? body.propertyDNA as PropertyDNA
        : {};

    const autoProfile = chooseProfile(dna);
    const profile = isProfile(body.musicProfile) ? body.musicProfile : autoProfile;
    const files = MUSIC_LIBRARY[profile];
    const track = files[hash(`${facts(dna)}|${clips.length}`) % files.length];

    await mkdir(tempDirectory, { recursive: true });

    const normalized: string[] = [];
    for (let i = 0; i < clips.length; i += 1) {
      const n = String(i + 1).padStart(2, "0");
      const downloaded = path.join(tempDirectory, `downloaded-${n}.mp4`);
      const normalizedPath = path.join(tempDirectory, `normalized-${n}.mp4`);
      await downloadFile(clips[i], downloaded, "Runway clip");
      await normalizeClip(downloaded, normalizedPath, i, clips.length);
      normalized.push(normalizedPath);
    }

    await concatClips(normalized, silentPath, tempDirectory);

    const selectedMusicPath =
      path.join(
        process.cwd(),
        "public",
        "music",
        profile,
        track
      );

    const fallbackMusicPath =
      path.join(
        process.cwd(),
        "public",
        "music",
        "walknwow-theme.mp3"
      );

    try {
      const selectedMusic =
        await readFile(
          selectedMusicPath
        );

      if (
        selectedMusic.length === 0
      ) {
        throw new Error(
          "Selected music file was empty."
        );
      }

      await writeFile(
        musicPath,
        selectedMusic
      );
    } catch (musicError) {
      console.error(
        `Could not read selected ${profile} track locally; using fallback.`,
        musicError
      );

      const fallbackMusic =
        await readFile(
          fallbackMusicPath
        );

      if (
        fallbackMusic.length === 0
      ) {
        throw new Error(
          "Fallback music file was empty."
        );
      }

      await writeFile(
        musicPath,
        fallbackMusic
      );
    }

    const totalDuration = normalized.length * CLIP_DURATION;
    await addMusic(silentPath, musicPath, finalPath, totalDuration);

    const finalVideo = await readFile(finalPath);
    if (!finalVideo.length) throw new Error("FFmpeg created an empty walkthrough video.");

    const blob = await put(`walkthroughs/${filename}`, finalVideo, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      clipCount: clips.length,
      filename,
      videoUrl: blob.url,
      blobUrl: blob.url,
      sizeBytes: finalVideo.length,
      transition: "fade-through-black",
      transitionDurationSeconds: FADE_DURATION,
      music: {
        enabled: true,
        profile,
        automaticProfile: autoProfile,
        selectionMode: isProfile(body.musicProfile) ? "manual" : "automatic",
        track,
        volume: MUSIC_VOLUME,
      },
    });
  } catch (error) {
    console.error("Merge clips error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "The walkthrough could not be merged.",
      },
      { status: 500 }
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}