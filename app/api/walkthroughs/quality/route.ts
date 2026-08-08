import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import {
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type RiskLevel = "low" | "medium" | "high";

type QualityRequest = {
  sourceImageUrl?: string;
  videoUrl?: string;
  category?: string;
  distortionRisk?: RiskLevel;
  blurRisk?: RiskLevel;
};

type QualityAnalysis = {
  pass: boolean;
  overallScore: number;
  sharpnessScore: number;
  architectureScore: number;
  geometryScore: number;
  continuityScore: number;
  motionScore: number;
  flickerScore: number;
  openingBlurDetected: boolean;
  architectureChanged: boolean;
  geometryWarpDetected: boolean;
  furnitureOrFixtureChanged: boolean;
  textureDriftDetected: boolean;
  smallObjectDriftDetected: boolean;
  materialDriftDetected: boolean;
  exteriorDriftDetected: boolean;
  lightingFlickerDetected: boolean;
  problems: string[];
  strengths: string[];
  retryPrompt: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const QUALITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "pass",
    "overallScore",
    "sharpnessScore",
    "architectureScore",
    "geometryScore",
    "continuityScore",
    "motionScore",
    "flickerScore",
    "openingBlurDetected",
    "architectureChanged",
    "geometryWarpDetected",
    "furnitureOrFixtureChanged",
    "textureDriftDetected",
    "smallObjectDriftDetected",
    "materialDriftDetected",
    "exteriorDriftDetected",
    "lightingFlickerDetected",
    "problems",
    "strengths",
    "retryPrompt",
  ],
  properties: {
    pass: { type: "boolean" },
    overallScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    sharpnessScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    architectureScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    geometryScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    continuityScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    motionScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    flickerScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    openingBlurDetected: {
      type: "boolean",
    },
    architectureChanged: {
      type: "boolean",
    },
    geometryWarpDetected: {
      type: "boolean",
    },
    furnitureOrFixtureChanged: {
      type: "boolean",
    },
    textureDriftDetected: {
      type: "boolean",
    },
    smallObjectDriftDetected: {
      type: "boolean",
    },
    materialDriftDetected: {
      type: "boolean",
    },
    exteriorDriftDetected: {
      type: "boolean",
    },
    lightingFlickerDetected: {
      type: "boolean",
    },
    problems: {
      type: "array",
      items: { type: "string" },
    },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    retryPrompt: {
      type: "string",
    },
  },
} as const;

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function risk(
  value: unknown,
  fallback: RiskLevel
): RiskLevel {
  return value === "low" ||
    value === "medium" ||
    value === "high"
    ? value
    : fallback;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function clampScore(value: unknown): number {
  const numeric =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : 0;

  return Math.max(
    0,
    Math.min(100, Math.round(numeric))
  );
}

function normalizeAnalysis(
  raw: QualityAnalysis
): QualityAnalysis {
  const problems = Array.isArray(raw.problems)
    ? raw.problems
        .filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0
        )
        .map((item) => item.trim())
        .slice(0, 20)
    : [];

  const strengths = Array.isArray(raw.strengths)
    ? raw.strengths
        .filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0
        )
        .map((item) => item.trim())
        .slice(0, 20)
    : [];

  const overallScore = clampScore(
  raw.overallScore
);

const sharpnessScore = clampScore(
  raw.sharpnessScore
);

const openingBlurDetected =
  raw.openingBlurDetected === true ||
  sharpnessScore < 88;

const hardFailure =
  openingBlurDetected ||
  raw.architectureChanged === true ||
  raw.geometryWarpDetected === true ||
  raw.furnitureOrFixtureChanged === true ||
  raw.textureDriftDetected === true ||
  raw.smallObjectDriftDetected === true ||
  raw.materialDriftDetected === true ||
  raw.exteriorDriftDetected === true;

  return {
    pass:
      raw.pass === true &&
      !hardFailure &&
      overallScore >= 82,
    overallScore,
    sharpnessScore: clampScore(
      raw.sharpnessScore
    ),
    architectureScore: clampScore(
      raw.architectureScore
    ),
    geometryScore: clampScore(
      raw.geometryScore
    ),
    continuityScore: clampScore(
      raw.continuityScore
    ),
    motionScore: clampScore(
      raw.motionScore
    ),
    flickerScore: clampScore(
      raw.flickerScore
    ),
    openingBlurDetected:
      raw.openingBlurDetected === true,
    architectureChanged:
      raw.architectureChanged === true,
    geometryWarpDetected:
      raw.geometryWarpDetected === true,
    furnitureOrFixtureChanged:
      raw.furnitureOrFixtureChanged === true,
    textureDriftDetected:
      raw.textureDriftDetected === true,
    smallObjectDriftDetected:
      raw.smallObjectDriftDetected === true,
    materialDriftDetected:
      raw.materialDriftDetected === true,
    exteriorDriftDetected:
      raw.exteriorDriftDetected === true,
    lightingFlickerDetected:
      raw.lightingFlickerDetected === true,
    problems,
    strengths,
    retryPrompt:
      typeof raw.retryPrompt === "string" &&
      raw.retryPrompt.trim()
        ? raw.retryPrompt.trim()
        : "Regenerate with less motion, a fully sharp opening frame, and stricter preservation of every visible architectural line, object, material, and furniture position.",
  };
}

function extractOutputText(
  response: OpenAIResponse
): string {
  if (
    typeof response.output_text === "string" &&
    response.output_text.trim()
  ) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        content.type === "output_text" &&
        typeof content.text === "string" &&
        content.text.trim()
      ) {
        return content.text;
      }
    }
  }

  return "";
}

async function runCommand(
  command: string,
  args: string[]
): Promise<void> {
  await new Promise<void>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        stdio: [
          "ignore",
          "ignore",
          "pipe",
        ],
      });

      let stderr = "";

      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });

      child.on("error", reject);

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `${command} failed with code ${code}: ${stderr}`
          )
        );
      });
    }
  );
}

async function downloadToFile(
  url: string,
  filePath: string
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not download media: ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  await writeFile(filePath, buffer);
}

async function resolveSourceImage(
  sourceImageUrl: string,
  workDir: string
): Promise<string> {
  if (isHttpUrl(sourceImageUrl)) {
    const response = await fetch(
      sourceImageUrl
    );

    if (!response.ok) {
      throw new Error(
        `Could not download source image: ${response.status}`
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "";

    const extension = contentType.includes(
      "png"
    )
      ? ".png"
      : contentType.includes("webp")
        ? ".webp"
        : ".jpg";

    const filePath = path.join(
      workDir,
      `source${extension}`
    );

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    await writeFile(filePath, buffer);

    return filePath;
  }

  if (!sourceImageUrl.startsWith("/")) {
    throw new Error(
      "The source image path is invalid."
    );
  }

  const localPath = path.join(
    process.cwd(),
    "public",
    sourceImageUrl.replace(/^\/+/, "")
  );

  await stat(localPath);

  return localPath;
}

async function imageToDataUrl(
  filePath: string
): Promise<string> {
  const buffer = await readFile(filePath);
  const extension = path
    .extname(filePath)
    .toLowerCase();

  const mime =
    extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg";

  return `data:${mime};base64,${buffer.toString(
    "base64"
  )}`;
}

async function getVideoDuration(
  videoPath: string
): Promise<number> {
  return await new Promise<number>(
    (resolve, reject) => {
      const child = spawn(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          videoPath,
        ],
        {
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        }
      );

      let stdout = "";
      let stderr = "";

      child.stdout.on(
        "data",
        (chunk) => {
          stdout += String(chunk);
        }
      );

      child.stderr.on(
        "data",
        (chunk) => {
          stderr += String(chunk);
        }
      );

      child.on("error", reject);

      child.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `ffprobe failed: ${stderr}`
            )
          );
          return;
        }

        const duration =
          Number.parseFloat(stdout.trim());

        if (
          !Number.isFinite(duration) ||
          duration <= 0
        ) {
          reject(
            new Error(
              "Could not determine video duration."
            )
          );
          return;
        }

        resolve(duration);
      });
    }
  );
}

async function extractFrame(
  videoPath: string,
  outputPath: string,
  timestamp: number
): Promise<void> {
  await runCommand("ffmpeg", [
    "-y",
    "-ss",
    timestamp.toFixed(3),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    "scale=1280:-2",
    "-q:v",
    "2",
    outputPath,
  ]);
}

function buildInspectorPrompt(
  category: string,
  distortionRisk: RiskLevel,
  blurRisk: RiskLevel
): string {
  return `
You are WalkNWow's strict real-estate video quality inspector.

You will receive:
1. The original listing photo.
2. A frame near the beginning of the generated clip.
3. A frame from the middle.
4. A frame near the end.

SCENE CONTEXT
Category: ${category || "other"}
Expected distortion risk: ${distortionRisk}
Expected blur risk: ${blurRisk}

CHECK THESE AREAS

1. SHARPNESS
The opening frame must already be sharp.
Reject visible opening blur, focus settling, smeared edges, or soft details.

2. ARCHITECTURAL ACCURACY
Compare all generated frames directly with the original image.
Reject changes to siding, rooflines, windows, doors, walls, ceilings, stairs, railings, cabinets, countertops, appliances, fixtures, mirrors, glass, flooring, furniture, landscaping, pools, fences, horizons, or views.

3. GEOMETRY
Reject warped walls, bending cabinets, moving windows, curved doors, stretched furniture, shifting room proportions, or impossible geometry.

4. CONTINUITY
Objects, materials, colors, fixtures, lighting, and furniture positions must remain consistent.

5. MOTION
Motion should resemble a slow stabilized gimbal glide.
Reject aggressive zooming, orbiting, spinning, impossible flying, abrupt movement, or excessive perspective change.

6. MICRO-DETAIL PRESERVATION
   Compare fine details directly against the original listing photo.
   Couch fabric, upholstery texture, cushion seams, pillows, blankets, rugs, flooring grain, stone texture, wood grain, countertop patterns, cabinet handles, appliance details, trim, railings, artwork, and decor must remain visually identical.
   Set textureDriftDetected=true when textures, seams, patterns, grain, or fine surface details visibly change.
   Set materialDriftDetected=true when a material changes color, finish, reflectivity, pattern, texture, or construction.

7. SMALL OBJECT PRESERVATION
   Every visible small object must keep the same shape, count, color, position, and orientation.
   Inspect coffee tables, dining tables, countertops, shelves, fireplace mantels, lamps, bottles, remotes, decor, handles, controls, artwork, and accessories.
   Set smallObjectDriftDetected=true if anything appears, disappears, moves, changes shape, merges, splits, or morphs.

8. EXTERIOR AND WINDOW-VIEW PRESERVATION
   Treat everything visible through windows and doors as locked source-image content.
   Trees, bushes, grass, decks, fences, neighboring structures, sky, horizons, and landscaping must remain consistent.
   Reject boiling vegetation, morphing trees, invented branches, changing landscaping, moving structures, or altered views.
   Set exteriorDriftDetected=true when exterior details change unnaturally.

9. FLICKER
   Reject lighting flicker, texture flicker, object popping, unstable materials, or temporal crawling.

SCORING
Use 0–100 scores.
A client-ready clip should score at least 82 overall.
Any architecture change, geometry warp, furniture or fixture change, texture drift, small-object drift, material drift, exterior drift, or obvious opening blur is an automatic failure.

RETRY PROMPT
When the clip fails, provide one concise regeneration instruction that directly addresses the problems.
Return strict JSON matching the required schema.
`;
}

function fallbackAnalysis(
  reason: string
): QualityAnalysis {
  return {
    pass: false,
    overallScore: 0,
    sharpnessScore: 0,
    architectureScore: 0,
    geometryScore: 0,
    continuityScore: 0,
    motionScore: 0,
    flickerScore: 0,
    openingBlurDetected: false,
    architectureChanged: false,
    geometryWarpDetected: false,
    furnitureOrFixtureChanged: false,
    textureDriftDetected: false,
    smallObjectDriftDetected: false,
    materialDriftDetected: false,
    exteriorDriftDetected: false,
    lightingFlickerDetected: false,
    problems: [
      `Automatic inspection could not complete: ${reason}`,
    ],
    strengths: [],
    retryPrompt:
      "Regenerate with an immediately sharp first frame, extremely restrained stabilized forward motion, and strict preservation of every visible architectural line, object, material, fixture, and furniture position.",
  };
}

export async function POST(
  request: Request
) {
  const workDir = path.join(
    os.tmpdir(),
    `walknwow-quality-${crypto.randomUUID()}`
  );

  try {
    const body =
      (await request.json()) as QualityRequest;

    const sourceImageUrl = text(
      body.sourceImageUrl
    );

    const videoUrl = text(
      body.videoUrl
    );

    if (!sourceImageUrl || !videoUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "sourceImageUrl and videoUrl are required.",
        },
        { status: 400 }
      );
    }

    if (!isHttpUrl(videoUrl)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "videoUrl must be an HTTP or HTTPS URL.",
        },
        { status: 400 }
      );
    }

    const openAIKey =
      process.env.OPENAI_API_KEY?.trim();

    if (!openAIKey) {
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis(
          "OPENAI_API_KEY is missing."
        ),
        usedFallback: true,
      });
    }

    await mkdir(workDir, {
      recursive: true,
    });

    const sourceImagePath =
      await resolveSourceImage(
        sourceImageUrl,
        workDir
      );

    const videoPath = path.join(
      workDir,
      "generated.mp4"
    );

    await downloadToFile(
      videoUrl,
      videoPath
    );

    const duration =
      await getVideoDuration(videoPath);

    const openingTime = Math.min(
      Math.max(0.1, duration * 0.04),
      Math.max(0.1, duration - 0.2)
    );

    const quarterTime = Math.min(
  Math.max(0.15, duration * 0.25),
  Math.max(0.15, duration - 0.18)
);

const middleTime = Math.min(
  Math.max(0.2, duration * 0.5),
  Math.max(0.2, duration - 0.15)
);

const threeQuarterTime = Math.min(
  Math.max(0.22, duration * 0.75),
  Math.max(0.22, duration - 0.12)
);

const endingTime = Math.min(
  Math.max(0.25, duration * 0.9),
  Math.max(0.25, duration - 0.08)
);

const openingPath = path.join(
  workDir,
  "opening.jpg"
);

const quarterPath = path.join(
  workDir,
  "quarter.jpg"
);

const middlePath = path.join(
  workDir,
  "middle.jpg"
);

const threeQuarterPath = path.join(
  workDir,
  "three-quarter.jpg"
);

const endingPath = path.join(
  workDir,
  "ending.jpg"
);

await extractFrame(
  videoPath,
  openingPath,
  openingTime
);

await extractFrame(
  videoPath,
  quarterPath,
  quarterTime
);

await extractFrame(
  videoPath,
  middlePath,
  middleTime
);

await extractFrame(
  videoPath,
  threeQuarterPath,
  threeQuarterTime
);

await extractFrame(
  videoPath,
  endingPath,
  endingTime
);

const sourceDataUrl =
  await imageToDataUrl(
    sourceImagePath
  );

const openingDataUrl =
  await imageToDataUrl(
    openingPath
  );

const quarterDataUrl =
  await imageToDataUrl(
    quarterPath
  );

const middleDataUrl =
  await imageToDataUrl(
    middlePath
  );

const threeQuarterDataUrl =
  await imageToDataUrl(
    threeQuarterPath
  );

const endingDataUrl =
  await imageToDataUrl(
    endingPath
  );

const distortionRisk = risk(
      body.distortionRisk,
      "medium"
    );

    const blurRisk = risk(
      body.blurRisk,
      "medium"
    );

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${openAIKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model:
            process.env
              .OPENAI_VISION_MODEL
              ?.trim() ||
            "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: buildInspectorPrompt(
                    text(body.category),
                    distortionRisk,
                    blurRisk
                  ),
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text:
                    "ORIGINAL LISTING PHOTO",
                },
                {
                  type: "input_image",
                  image_url:
                    sourceDataUrl,
                  detail: "high",
                },
                {
                  type: "input_text",
                  text:
                    "GENERATED OPENING FRAME",
                },
                {
                  type: "input_image",
                  image_url:
                    openingDataUrl,
                  detail: "high",
                },
                {
                  type: "input_text",
                  text:
                    "GENERATED MIDDLE FRAME",
                },
                {
                  type: "input_image",
                  image_url:
                    middleDataUrl,
                  detail: "high",
                },
                {
                  type: "input_text",
                  text:
                    "GENERATED ENDING FRAME",
                },
                {
                  type: "input_image",
                  image_url:
                    endingDataUrl,
                  detail: "high",
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name:
                "walknwow_quality_analysis",
              strict: true,
              schema: QUALITY_SCHEMA,
            },
          },
          temperature: 0.1,
          max_output_tokens: 3000,
        }),
      }
    );

    const responseData =
      (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      const message =
        responseData.error?.message ??
        `OpenAI returned status ${response.status}.`;

      return NextResponse.json({
        success: true,
        analysis:
          fallbackAnalysis(message),
        usedFallback: true,
      });
    }

    const outputText =
      extractOutputText(responseData);

    if (!outputText) {
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis(
          "OpenAI returned no structured quality result."
        ),
        usedFallback: true,
      });
    }

    let parsed: QualityAnalysis;

    try {
      parsed = JSON.parse(
        outputText
      ) as QualityAnalysis;
    } catch {
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis(
          "OpenAI returned invalid JSON."
        ),
        usedFallback: true,
      });
    }

    const analysis =
      normalizeAnalysis(parsed);

    return NextResponse.json({
      success: true,
      usedFallback: false,
      analysis,
      sampledFrames: {
        openingSeconds:
          Number(
            openingTime.toFixed(3)
          ),
        middleSeconds:
          Number(
            middleTime.toFixed(3)
          ),
        endingSeconds:
          Number(
            endingTime.toFixed(3)
          ),
      },
    });
  } catch (error) {
    console.error(
      "WalkNWow V2 quality error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The quality inspection failed.",
      },
      { status: 500 }
    );
  } finally {
    await rm(workDir, {
      recursive: true,
      force: true,
    }).catch(() => undefined);
  }
}