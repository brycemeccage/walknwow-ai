import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type UpscaleRequest = {
  videoUrl?: unknown;
  resolution?: unknown;
};

type CreateTaskResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

type TaskResponse = {
  id?: string;
  status?: string;
  output?: unknown;
  failure?: string;
  failureCode?: string;
  error?: {
    message?: string;
  };
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function resolution(value: unknown): "720p" | "1k" | "2k" | "4k" {
  return value === "720p" ||
    value === "1k" ||
    value === "2k" ||
    value === "4k"
    ? value
    : "2k";
}

function extractVideoUrl(output: unknown): string {
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0];
  }

  if (typeof output === "object" && output !== null) {
    const record = output as Record<string, unknown>;

    for (const key of ["videoUrl", "url", "uri", "outputUrl"]) {
      const value = record[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return "";
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function createUpscaleTask(args: {
  apiKey: string;
  videoUrl: string;
  resolution: "720p" | "1k" | "2k" | "4k";
}): Promise<string> {
  const response = await fetch(
    "https://api.dev.runwayml.com/v1/video_upscale",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "magnific_video_upscaler_creative",
        videoUri: args.videoUrl,
        resolution: args.resolution,
      }),
    }
  );

  const data = (await response.json()) as CreateTaskResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `Runway upscale request failed with status ${response.status}.`
    );
  }

  if (typeof data.id !== "string" || !data.id.trim()) {
    throw new Error("Runway did not return an upscale task ID.");
  }

  return data.id.trim();
}

async function waitForTask(args: {
  apiKey: string;
  taskId: string;
}): Promise<string> {
  const deadline = Date.now() + 9 * 60 * 1000;

  while (Date.now() < deadline) {
    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${args.taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "X-Runway-Version": "2024-11-06",
        },
        cache: "no-store",
      }
    );

    const task = (await response.json()) as TaskResponse;

    if (!response.ok) {
      throw new Error(
        task.error?.message ??
          `Runway task lookup failed with status ${response.status}.`
      );
    }

    if (task.status === "SUCCEEDED") {
      const videoUrl = extractVideoUrl(task.output);

      if (!videoUrl) {
        throw new Error(
          "Runway finished the upscale task but returned no output video URL."
        );
      }

      return videoUrl;
    }

    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(
        task.failure ||
          task.failureCode ||
          "Runway upscale task failed."
      );
    }

    await sleep(3000);
  }

  throw new Error("The video upscale task timed out.");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpscaleRequest;

    const videoUrl = text(body.videoUrl);

    if (!/^https:\/\//i.test(videoUrl)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid HTTPS videoUrl is required.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RUNWAYML_API_SECRET?.trim();

    if (!apiKey || !apiKey.startsWith("key_")) {
      return NextResponse.json(
        {
          success: false,
          message: "RUNWAYML_API_SECRET is missing or invalid.",
        },
        { status: 500 }
      );
    }

    const selectedResolution = resolution(body.resolution);

    const taskId = await createUpscaleTask({
      apiKey,
      videoUrl,
      resolution: selectedResolution,
    });

    const upscaledVideoUrl = await waitForTask({
      apiKey,
      taskId,
    });

    return NextResponse.json({
      success: true,
      taskId,
      originalVideoUrl: videoUrl,
      upscaledVideoUrl,
      resolution: selectedResolution,
      model: "magnific_video_upscaler_creative",
      message: `Video upscaled successfully to ${selectedResolution}.`,
    });
  } catch (error) {
    console.error("WalkNWow upscale-video error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Video upscaling failed.",
      },
      { status: 500 }
    );
  }
}