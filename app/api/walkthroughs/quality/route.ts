import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

import { assessArchitecture } from "@/lib/quality/architecture";
import { assessBlurFromScores } from "@/lib/quality/blur";
import { assessGeometry } from "@/lib/quality/geometry";
import {
  calculateOverallQuality,
  shouldRejectQuality,
} from "@/lib/quality/scoring";

export const runtime = "nodejs";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

const FFMPEG_PATH =
  process.env.FFMPEG_PATH?.trim() ||
  ffmpegStatic ||
  "ffmpeg";

const FFPROBE_PATH =
  process.env.FFPROBE_PATH?.trim() ||
  ffprobeStatic.path ||
  "ffprobe";

type RiskLevel = "low" | "medium" | "high";

type QualityRequest = {
  sourceImageUrl?: unknown;
  videoUrl?: unknown;
  category?: unknown;
  distortionRisk?: unknown;
  blurRisk?: unknown;
};

type ModelAnalysis = {
  openingSharpness: number;
  middleSharpness: number;
  endingSharpness: number;
  architectureScore: number;
  geometryScore: number;
  continuityScore: number;
  motionScore: number;
  flickerScore: number;
  architectureChanged: boolean;
  geometryWarpDetected: boolean;
  furnitureOrFixtureChanged: boolean;
  vegetationDriftDetected: boolean;
  lightingFlickerDetected: boolean;
  excessiveMotionDetected: boolean;
  problems: string[];
  strengths: string[];
  retryPrompt: string;
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
  vegetationDriftDetected: boolean;
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
    "openingSharpness",
    "middleSharpness",
    "endingSharpness",
    "architectureScore",
    "geometryScore",
    "continuityScore",
    "motionScore",
    "flickerScore",
    "architectureChanged",
    "geometryWarpDetected",
    "furnitureOrFixtureChanged",
    "vegetationDriftDetected",
    "lightingFlickerDetected",
    "excessiveMotionDetected",
    "problems",
    "strengths",
    "retryPrompt",
  ],
  properties: {
    openingSharpness: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    middleSharpness: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    endingSharpness: {
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
    architectureChanged: {
      type: "boolean",
    },
    geometryWarpDetected: {
      type: "boolean",
    },
    furnitureOrFixtureChanged: {
      type: "boolean",
    },
    vegetationDriftDetected: {
      type: "boolean",
    },
    lightingFlickerDetected: {
      type: "boolean",
    },
    excessiveMotionDetected: {
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

function text(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : fallback;
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

function clampScore(
  value: unknown,
  fallback = 50
): number {
  const numberValue =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : fallback;

  return Math.max(
    0,
    Math.min(100, Math.round(numberValue))
  );
}

function stringList(
  value: unknown,
  max = 20
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0
    )
    .map((item) => item.trim())
    .slice(0, max);
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

function mimeFromPath(
  filePath: string
): string {
  const extension = path
    .extname(filePath)
    .toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

async function fileToDataUrl(
  filePath: string
): Promise<string> {
  const buffer = await readFile(filePath);
  const mime = mimeFromPath(filePath);

  return `data:${mime};base64,${buffer.toString(
    "base64"
  )}`;
}

async function downloadToFile(
  url: string,
  outputPath: string
): Promise<void> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Download failed with status ${response.status}.`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  await writeFile(
    outputPath,
    Buffer.from(arrayBuffer)
  );
}

async function resolveSourceImage(
  sourceImageUrl: string,
  tempDirectory: string
): Promise<string> {
  if (/^https?:\/\//i.test(sourceImageUrl)) {
    const extension =
      path.extname(
        new URL(sourceImageUrl).pathname
      ) || ".jpg";

    const outputPath = path.join(
      tempDirectory,
      `source${extension}`
    );

    await downloadToFile(
      sourceImageUrl,
      outputPath
    );

    return outputPath;
  }

  if (!sourceImageUrl.startsWith("/")) {
    throw new Error(
      "The source image must be an HTTP URL or a public path beginning with '/'."
    );
  }

  return path.join(
    process.cwd(),
    "public",
    sourceImageUrl.replace(/^\/+/, "")
  );
}

async function getVideoDuration(
  videoPath: string
): Promise<number> {
  const { stdout } =
    await execFileAsync(
      FFPROBE_PATH,
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
        maxBuffer: 1024 * 1024,
      }
    );

  const duration =
    Number.parseFloat(stdout.trim());

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new Error(
      "FFprobe could not determine the clip duration."
    );
  }

  return duration;
}

async function extractFrame(
  videoPath: string,
  seconds: number,
  outputPath: string
): Promise<void> {
  await execFileAsync(
    FFMPEG_PATH,
    [
      "-y",
      "-ss",
      seconds.toFixed(3),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-vf",
      "scale='min(1280,iw)':-2",
      "-q:v",
      "2",
      outputPath,
    ],
    {
      maxBuffer: 8 * 1024 * 1024,
    }
  );
}

function buildSystemPrompt(args: {
  category: string;
  distortionRisk: RiskLevel;
  blurRisk: RiskLevel;
}): string {
  return `
You are WalkNWow Quality V3, a ruthless real-estate video quality inspector.

You will compare:
1. the original source listing photo
2. an opening video frame
3. a middle video frame
4. an ending video frame

The property category is: ${args.category}
Expected distortion risk: ${args.distortionRisk}
Expected blur risk: ${args.blurRisk}

Your job is to protect the real property from AI hallucination and temporal instability.

FAIL THE CLIP when any meaningful issue is visible:
- blurry or unresolved opening frame
- focus settling or sharpening ramp
- soft middle or ending frame
- added or removed objects
- moved furniture
- changed fixtures, cabinetry, countertops, appliances, windows, or doors
- changed roof, siding, walls, floors, trim, railings, stairs, mirrors, or glass
- bent walls, warped straight lines, or stretched room proportions
- inconsistent reflections
- flickering light or exposure
- aggressive camera movement
- perspective movement that reveals invented unseen areas

NATURE / EXTERIOR LOCK

Everything outdoors and everything visible through windows or glass is locked source-image content.

Inspect trees, trunks, branches, leaves, bushes, shrubs, grass, flowers, landscaping, fences, decks, neighboring structures, sky, clouds, water, horizon, distant scenery, and outdoor reflections.

Set vegetationDriftDetected=true and FAIL the clip if:
- tree trunks or major branches change shape, thickness, location, angle, or count
- branches appear, disappear, split, merge, bend, stretch, or relocate
- foliage boils, crawls, shimmers, pulses, melts, morphs, flickers, or regenerates
- bushes or shrubs change silhouette, boundary, size, position, or texture
- grass smears, crawls, flickers, changes pattern, or moves unnaturally
- plants, flowers, trees, branches, or landscaping appear or disappear
- window views change composition
- fences, decks, neighboring structures, horizons, or exterior objects move or morph
- reflections in windows or glass stop matching the exterior scene
- sky or cloud behavior creates obvious AI instability
- any natural element visibly changes identity between frames

Tiny natural leaf movement is acceptable only when tree identity, branch structure, foliage silhouette, density, and position remain stable.
Do not excuse obvious vegetation instability as wind.

SCORING

100 means visually faithful and professional.
90–99 means excellent.
82–89 means acceptable.
Below 82 should normally fail.

Any clear architecture change, geometry warp, furniture or fixture change, vegetation drift, or opening blur is an automatic failure even when the average score is high.

SHARPNESS

The opening frame must already be fully resolved.
Do not excuse blur because later frames become sharper.

MOTION

The desired camera behavior is restrained, nearly static professional gimbal movement.
Penalize aggressive forward motion, lateral sweeps, orbiting, panning, tilting, rolling, zooming, or perspective jumps.

RETRY PROMPT

When vegetationDriftDetected=true, explicitly tell the generator to lock tree trunks, branch structure, foliage silhouettes, bushes, grass, landscaping, window views, and exterior reflections to the source image with nearly zero environmental motion.
When there is any other failure, write one concise corrective regeneration instruction.
When the clip is excellent, retryPrompt may say that no retry is required.

Return strict JSON matching the supplied schema.
`;
}

async function inspectWithOpenAI(args: {
  apiKey: string;
  model: string;
  category: string;
  distortionRisk: RiskLevel;
  blurRisk: RiskLevel;
  sourceImageDataUrl: string;
  openingFrameDataUrl: string;
  middleFrameDataUrl: string;
  endingFrameDataUrl: string;
}): Promise<ModelAnalysis> {
  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${args.apiKey}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        model: args.model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: buildSystemPrompt({
                  category: args.category,
                  distortionRisk:
                    args.distortionRisk,
                  blurRisk: args.blurRisk,
                }),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "ORIGINAL SOURCE LISTING PHOTO",
              },
              {
                type: "input_image",
                image_url:
                  args.sourceImageDataUrl,
                detail: "high",
              },
              {
                type: "input_text",
                text:
                  "VIDEO OPENING FRAME",
              },
              {
                type: "input_image",
                image_url:
                  args.openingFrameDataUrl,
                detail: "high",
              },
              {
                type: "input_text",
                text:
                  "VIDEO MIDDLE FRAME",
              },
              {
                type: "input_image",
                image_url:
                  args.middleFrameDataUrl,
                detail: "high",
              },
              {
                type: "input_text",
                text:
                  "VIDEO ENDING FRAME",
              },
              {
                type: "input_image",
                image_url:
                  args.endingFrameDataUrl,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name:
              "walknwow_quality_v3",
            strict: true,
            schema: QUALITY_SCHEMA,
          },
        },
        max_output_tokens: 3500,
      }),
    }
  );

  const data =
    (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `OpenAI returned status ${response.status}.`
    );
  }

  const outputText =
    extractOutputText(data);

  if (!outputText) {
    throw new Error(
      "OpenAI returned no quality analysis."
    );
  }

  try {
    return JSON.parse(
      outputText
    ) as ModelAnalysis;
  } catch {
    throw new Error(
      "OpenAI returned invalid quality JSON."
    );
  }
}

function normalizeAnalysis(
  raw: ModelAnalysis
): QualityAnalysis {
  const blur = assessBlurFromScores(
    clampScore(raw.openingSharpness),
    clampScore(raw.middleSharpness)
  );

  const architecture =
    assessArchitecture({
      architectureScore:
        clampScore(
          raw.architectureScore
        ),
      furnitureChanged:
        raw.furnitureOrFixtureChanged,
      problems:
        raw.architectureChanged
          ? stringList(raw.problems)
          : [],
    });

  const geometry =
    assessGeometry(
      clampScore(raw.geometryScore),
      raw.geometryWarpDetected
        ? stringList(raw.problems)
        : []
    );

  const scores = {
    sharpnessScore:
      clampScore(
        Math.round(
          clampScore(
            raw.openingSharpness
          ) *
            0.5 +
            clampScore(
              raw.middleSharpness
            ) *
              0.3 +
            clampScore(
              raw.endingSharpness
            ) *
              0.2
        )
      ),
    architectureScore:
      architecture.architectureScore,
    geometryScore:
      geometry.geometryScore,
    continuityScore:
      clampScore(raw.continuityScore),
    motionScore:
      clampScore(raw.motionScore),
    flickerScore:
      clampScore(raw.flickerScore),
  };

  const overallScore =
    calculateOverallQuality(scores);

  const architectureChanged =
    raw.architectureChanged ||
    architecture.architectureChanged;

  const geometryWarpDetected =
    raw.geometryWarpDetected ||
    geometry.geometryWarpDetected;

  const furnitureOrFixtureChanged =
    raw.furnitureOrFixtureChanged ||
    architecture.furnitureOrFixtureChanged;

  const openingBlurDetected =
    raw.openingSharpness < 88 ||
    scores.sharpnessScore < 88 ||
    blur.openingBlurDetected;

  const vegetationDriftDetected =
    raw.vegetationDriftDetected === true;

  const lightingFlickerDetected =
    raw.lightingFlickerDetected ||
    scores.flickerScore < 78;

  const problems =
    stringList(raw.problems, 25);

  if (
    raw.excessiveMotionDetected &&
    !problems.some((problem) =>
      problem.toLowerCase().includes(
        "motion"
      )
    )
  ) {
    problems.push(
      "Camera movement is too aggressive."
    );
  }

  const pass =
    !shouldRejectQuality({
      overallScore,
      openingBlurDetected,
      architectureChanged,
      geometryWarpDetected,
      furnitureOrFixtureChanged,
    }) &&
    !vegetationDriftDetected &&
    !lightingFlickerDetected &&
    !raw.excessiveMotionDetected &&
    scores.motionScore >= 78;

  return {
    pass,
    overallScore,
    ...scores,
    openingBlurDetected,
    architectureChanged,
    geometryWarpDetected,
    furnitureOrFixtureChanged,
    vegetationDriftDetected,
    lightingFlickerDetected,
    problems,
    strengths:
      stringList(raw.strengths, 20),
    retryPrompt:
      text(
        raw.retryPrompt,
        pass
          ? "No retry required."
          : "Regenerate with almost-static camera movement. Preserve every object, architectural line, material, fixture, furnishing, reflection, tree trunk, branch structure, foliage silhouette, grass area, landscape element, and window view exactly. Begin fully sharp. Use nearly zero environmental motion. Do not add, remove, move, morph, shimmer, boil, or redesign anything."
      ),
  };
}

export async function POST(
  request: Request
) {
  let tempDirectory = "";

  try {
    const body =
      (await request.json()) as QualityRequest;

    const sourceImageUrl =
      text(body.sourceImageUrl);

    const videoUrl =
      text(body.videoUrl);

    if (!sourceImageUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "sourceImageUrl is required.",
        },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "videoUrl is required.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OPENAI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    tempDirectory =
      await mkdtemp(
        path.join(
          os.tmpdir(),
          "walknwow-quality-"
        )
      );

    const videoPath =
      path.join(
        tempDirectory,
        "clip.mp4"
      );

    await downloadToFile(
      videoUrl,
      videoPath
    );

    const sourceImagePath =
      await resolveSourceImage(
        sourceImageUrl,
        tempDirectory
      );

    const duration =
      await getVideoDuration(
        videoPath
      );

    const openingTime =
      Math.min(
        Math.max(0.05, duration * 0.04),
        Math.max(0.05, duration - 0.1)
      );

    const middleTime =
      Math.max(
        0.05,
        duration * 0.5
      );

    const endingTime =
      Math.max(
        0.05,
        duration - 0.12
      );

    const openingPath =
      path.join(
        tempDirectory,
        "opening.jpg"
      );

    const middlePath =
      path.join(
        tempDirectory,
        "middle.jpg"
      );

    const endingPath =
      path.join(
        tempDirectory,
        "ending.jpg"
      );

    await Promise.all([
      extractFrame(
        videoPath,
        openingTime,
        openingPath
      ),
      extractFrame(
        videoPath,
        middleTime,
        middlePath
      ),
      extractFrame(
        videoPath,
        endingTime,
        endingPath
      ),
    ]);

    const [
      sourceImageDataUrl,
      openingFrameDataUrl,
      middleFrameDataUrl,
      endingFrameDataUrl,
    ] = await Promise.all([
      fileToDataUrl(
        sourceImagePath
      ),
      fileToDataUrl(
        openingPath
      ),
      fileToDataUrl(
        middlePath
      ),
      fileToDataUrl(
        endingPath
      ),
    ]);

    const rawAnalysis =
      await inspectWithOpenAI({
        apiKey,
        model:
          process.env
            .OPENAI_QUALITY_MODEL
            ?.trim() ||
          "gpt-4.1-mini",
        category:
          text(body.category, "other"),
        distortionRisk:
          risk(
            body.distortionRisk,
            "medium"
          ),
        blurRisk:
          risk(
            body.blurRisk,
            "medium"
          ),
        sourceImageDataUrl,
        openingFrameDataUrl,
        middleFrameDataUrl,
        endingFrameDataUrl,
      });

    const analysis =
      normalizeAnalysis(
        rawAnalysis
      );

    return NextResponse.json({
      success: true,
      analysis,
      usedFallback: false,
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
      message: analysis.pass
        ? `Quality passed with a score of ${analysis.overallScore}.`
        : `Quality failed with a score of ${analysis.overallScore}.`,
    });
  } catch (error) {
    console.error(
      "WalkNWow Quality V3 error:",
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
    if (tempDirectory) {
      await rm(
        tempDirectory,
        {
          recursive: true,
          force: true,
        }
      ).catch(() => undefined);
    }
  }
}