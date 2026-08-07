import RunwayML from "@runwayml/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type PresetKey =
  | "locked_2s"
  | "locked_3s"
  | "environmental_2s"
  | "environmental_3s"
  | "current_production";

type MotionStyle =
  | "locked"
  | "environmental"
  | "production";

type GenerationLabRequest = {
  imageUrl?: unknown;
  category?: unknown;
  preset?: unknown;
  durationSeconds?: unknown;
  motionStyle?: unknown;
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function normalizePreset(value: unknown): PresetKey {
  return value === "locked_2s" ||
    value === "locked_3s" ||
    value === "environmental_2s" ||
    value === "environmental_3s" ||
    value === "current_production"
    ? value
    : "locked_2s";
}

function normalizeMotionStyle(value: unknown): MotionStyle {
  return value === "locked" ||
    value === "environmental" ||
    value === "production"
    ? value
    : "locked";
}

function normalizeDuration(value: unknown): 2 | 3 | 4 {
  return value === 3 || value === 4 ? value : 2;
}

function mimeFromExtension(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

async function resolvePromptImage(imageUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (!imageUrl.startsWith("/")) {
    throw new Error(
      "The image URL must be an HTTP URL or a public path beginning with '/'."
    );
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    imageUrl.replace(/^\/+/, "")
  );

  const buffer = await readFile(filePath);
  const mime = mimeFromExtension(filePath);

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function environmentalInstruction(category: string): string {
  if (
    [
      "front_exterior",
      "rear_exterior",
      "backyard",
      "pool",
      "view",
    ].includes(category)
  ) {
    return "Allow only subtle natural movement in existing water, trees, leaves, flags, clouds, or fire when already visible.";
  }

  return "Allow only subtle natural movement in existing curtains, fire, or ceiling fans when already visible.";
}

function buildPrompt(args: {
  category: string;
  motionStyle: MotionStyle;
}): string {
  const base =
    "Photorealistic video of this exact real property. Preserve architecture, furniture, fixtures, materials, landscaping, reflections, lighting, colors, proportions, and perspective exactly. Do not add, remove, move, redesign, repaint, relight, restage, stretch, bend, replace, or invent anything. Do not reveal unseen areas. Begin sharp, remain sharp, and end sharp. No focus settling, opening blur, motion smear, flicker, or exposure shift.";

  if (args.motionStyle === "locked") {
    return `${base} Treat the image as a locked tripod shot. Keep the camera completely stationary. No pan, tilt, orbit, zoom, dolly, slide, roll, drift, or perspective change. Keep every scene element still.`.slice(
      0,
      950
    );
  }

  if (args.motionStyle === "environmental") {
    return `${base} Treat the image as a locked tripod shot. Keep the camera stationary. ${environmentalInstruction(
      args.category
    )} Do not animate furniture, walls, fixtures, reflections, decor, lighting, or architecture.`.slice(
      0,
      950
    );
  }

  return `${base} Use extremely restrained professional motion only, no more than a tiny centered micro-push. No orbiting, panning, tilting, rolling, lateral sweep, fast zoom, or perspective jump.`.slice(
    0,
    950
  );
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as GenerationLabRequest;

    const imageUrl = text(body.imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "An image URL is required.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RUNWAYML_API_SECRET?.trim();

    if (!apiKey || !apiKey.startsWith("key_")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "RUNWAYML_API_SECRET is missing or invalid.",
        },
        { status: 500 }
      );
    }

    const selectedPreset = normalizePreset(body.preset);
    const selectedMotionStyle =
      normalizeMotionStyle(body.motionStyle);
    const selectedDuration =
      normalizeDuration(body.durationSeconds);
    const category = text(body.category, "other");

    const promptImage = await resolvePromptImage(imageUrl);
    const promptText = buildPrompt({
      category,
      motionStyle: selectedMotionStyle,
    });

    const runway = new RunwayML({
      apiKey,
    });

    const task = await runway.imageToVideo
      .create({
        model: "gen4.5",
        promptImage,
        promptText,
        ratio: "1280:720",
        duration: selectedDuration,
      })
      .waitForTaskOutput();

    const videoUrl = task.output?.[0];

    if (typeof videoUrl !== "string" || !videoUrl.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Runway completed the task but returned no video URL.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      videoUrl,
      preset: selectedPreset,
      durationSeconds: selectedDuration,
      motionStyle: selectedMotionStyle,
      promptLength: promptText.length,
    });
  } catch (error) {
    console.error("WalkNWow Generation Lab error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Generation Lab failed.",
      },
      { status: 500 }
    );
  }
}