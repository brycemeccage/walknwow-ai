import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type RiskLevel = "low" | "medium" | "high";

type RetryManagerRequest = {
  imageUrl?: unknown;
  category?: unknown;
  scene?: unknown;
  propertyDNA?: unknown;
  maxAttempts?: unknown;
  passingScore?: unknown;
};

type SceneInput = {
  sceneNumber?: number;
  photoNumber?: number;
  category?: string;
  roomLabel?: string;
  storyRole?: string;
  visibleFeatures?: string[];
  preservationRules?: string[];
  transitionIntent?: string;
  distortionRisk?: RiskLevel;
  blurRisk?: RiskLevel;
  criticalArchitecture?: string[];
  lockedObjects?: string[];
};

type GenerateResponse = {
  success?: boolean;
  videoUrl?: string;
  taskId?: string;
  message?: string;
  propertyLock?: {
    lockedCount?: number;
    architectureCount?: number;
    objectCount?: number;
    preservationPriority?: string;
    criticalArchitecture?: string[];
    lockedObjects?: string[];
    qualityChecklist?: string[];
  };
};

type QualityResponse = {
  success?: boolean;
  analysis?: {
    pass?: boolean;
    overallScore?: number;
    sharpnessScore?: number;
    openingSharpness?: number;
    middleSharpness?: number;
    endingSharpness?: number;
    architectureScore?: number;
    geometryScore?: number;
    continuityScore?: number;
    motionScore?: number;
    flickerScore?: number;
    openingBlurDetected?: boolean;
    middleBlurDetected?: boolean;
    endingBlurDetected?: boolean;
    vegetationDriftDetected?: boolean;
    architectureChanged?: boolean;
    geometryWarpDetected?: boolean;
    furnitureOrFixtureChanged?: boolean;
    lightingFlickerDetected?: boolean;
    problems?: string[];
    strengths?: string[];
    retryPrompt?: string;
  };
  message?: string;
};

type AttemptResult = {
  attemptNumber: number;
  status: "passed" | "failed" | "error";
  videoUrl: string;
  taskId: string;
  overallScore: number;
  sharpnessScore: number;
  minimumFrameSharpness: number;
  motionScore: number;
  architectureChanged: boolean;
  geometryWarpDetected: boolean;
  furnitureOrFixtureChanged: boolean;
  vegetationDriftDetected: boolean;
  hallucinationFailure: boolean;
  pass: boolean;
  problems: string[];
  strengths: string[];
  retryPrompt: string;
  runtimeSeconds: number;
  generationMessage: string;
  qualityMessage: string;
};

function text(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : fallback;
}

function number(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const parsed =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : fallback;

  return Math.max(
    minimum,
    Math.min(maximum, parsed)
  );
}

function stringList(
  value: unknown,
  max = 30
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

function normalizeScene(
  value: unknown,
  category: string
): SceneInput {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return {
      category,
    };
  }

  const scene =
    value as Record<string, unknown>;

  return {
    sceneNumber:
      typeof scene.sceneNumber === "number"
        ? scene.sceneNumber
        : undefined,
    photoNumber:
      typeof scene.photoNumber === "number"
        ? scene.photoNumber
        : undefined,
    category:
      text(scene.category, category),
    roomLabel:
      text(scene.roomLabel),
    storyRole:
      text(scene.storyRole),
    visibleFeatures:
      stringList(
        scene.visibleFeatures,
        20
      ),
    preservationRules:
      stringList(
        scene.preservationRules,
        25
      ),
    transitionIntent:
      text(scene.transitionIntent),
    distortionRisk:
      scene.distortionRisk === "low" ||
      scene.distortionRisk === "high"
        ? scene.distortionRisk
        : "medium",
    blurRisk:
      scene.blurRisk === "low" ||
      scene.blurRisk === "high"
        ? scene.blurRisk
        : "medium",
    criticalArchitecture:
      stringList(
        scene.criticalArchitecture,
        20
      ),
    lockedObjects:
      stringList(
        scene.lockedObjects,
        25
      ),
  };
}

function retryRules(
  attemptNumber: number,
  previousRetryPrompt: string,
  previousProblems: string[]
): string[] {
  if (attemptNumber === 1) {
    return [
      "Create a real stabilized walkthrough using a slow forward camera translation and subtle natural parallax.",
      "Do not fake movement with a flat zoom or panoramic still-image pan.",
      "Keep every frame fully sharp from beginning through middle to end.",
      "Preserve every visible object, architectural line, material, tree, branch, landscape element, reflection, and window view.",
      "Do not add, remove, restage, redesign, or invent anything.",
    ];
  }

  if (attemptNumber === 2) {
    return [
      "QUALITY RETRY: reduce camera travel while keeping a real forward walkthrough translation with subtle parallax.",
      "Keep opening, middle, and ending frames equally crisp and resolved.",
      "No focus pull, motion smear, softening, depth-of-field blur, or texture regeneration.",
      "Preserve exact architecture, furniture, object count, materials, trees, branches, landscaping, reflections, and views.",
      previousRetryPrompt,
      ...previousProblems.map(
        (problem) => `Correct this previous failure: ${problem}`
      ),
    ].filter(Boolean);
  }

  return [
    "FINAL FIDELITY RETRY: use only a tiny stabilized forward camera translation with real parallax; do not become a completely static still.",
    "Prioritize sharpness and source fidelity over movement distance.",
    "Every sampled frame must remain fully sharp.",
    "Do not add, remove, move, recolor, resize, replace, redesign, morph, shimmer, or invent anything.",
    "Lock architecture, furniture, small objects, textures, trees, branches, foliage silhouettes, landscaping, reflections, and window views to the source.",
    previousRetryPrompt,
    ...previousProblems.map(
      (problem) => `Eliminate this prior issue: ${problem}`
    ),
  ].filter(Boolean);
}

async function postJson<T>(
  url: string,
  body: unknown
): Promise<{
  ok: boolean;
  status: number;
  data: T;
}> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: T;

  try {
    data =
      (await response.json()) as T;
  } catch {
    throw new Error(
      `Route returned non-JSON response with status ${response.status}.`
    );
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function POST(
  request: Request
) {
  const startedAt = Date.now();

  try {
    const body =
      (await request.json()) as RetryManagerRequest;

    const imageUrl =
      text(body.imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "imageUrl is required.",
        },
        { status: 400 }
      );
    }

    const category =
      text(
        body.category,
        "other"
      );

    const maxAttempts =
      Math.round(
        number(
          body.maxAttempts,
          3,
          1,
          3
        )
      );

    const passingScore =
      number(
        body.passingScore,
        90,
        70,
        100
      );

    const baseScene =
      normalizeScene(
        body.scene,
        category
      );

    const origin =
      new URL(request.url).origin;

    const generateUrl =
      `${origin}/api/walkthroughs/generate-clip`;

    const qualityUrl =
      `${origin}/api/walkthroughs/quality`;

    const attempts:
      AttemptResult[] = [];

    let previousRetryPrompt = "";
    let previousProblems:
      string[] = [];

    for (
      let attemptNumber = 1;
      attemptNumber <= maxAttempts;
      attemptNumber += 1
    ) {
      const attemptStartedAt =
        Date.now();

      const additionalRules =
        retryRules(
          attemptNumber,
          previousRetryPrompt,
          previousProblems
        );

      const attemptScene:
        SceneInput = {
        ...baseScene,
        category,
        preservationRules: [
          ...stringList(
            baseScene.preservationRules,
            20
          ),
          ...additionalRules,
        ].slice(0, 35),
      };

      try {
        const generation =
          await postJson<GenerateResponse>(
            generateUrl,
            {
              imageUrl,
              category,
              scene: attemptScene,
              propertyDNA:
                body.propertyDNA ??
                {},
            }
          );

        if (
          !generation.ok ||
          !generation.data.success ||
          !generation.data.videoUrl
        ) {
          throw new Error(
            generation.data.message ||
              `Generation failed with status ${generation.status}.`
          );
        }

        const quality =
          await postJson<QualityResponse>(
            qualityUrl,
            {
              sourceImageUrl:
                imageUrl,
              videoUrl:
                generation.data.videoUrl,
              category,
              distortionRisk:
                attemptScene.distortionRisk,
              blurRisk:
                attemptScene.blurRisk,
              propertyLock:
                generation.data
                  .propertyLock,
            }
          );

        if (
          !quality.ok ||
          !quality.data.success ||
          !quality.data.analysis
        ) {
          throw new Error(
            quality.data.message ||
              `Quality inspection failed with status ${quality.status}.`
          );
        }

        const analysis =
          quality.data.analysis;

        const score =
          number(
            analysis.overallScore,
            0,
            0,
            100
          );

        const sharpnessScore =
          number(
            analysis.sharpnessScore,
            0,
            0,
            100
          );

        const motionScore =
          number(
            analysis.motionScore,
            0,
            0,
            100
          );

        const minimumFrameSharpness =
          Math.min(
            number(analysis.openingSharpness, sharpnessScore, 0, 100),
            number(analysis.middleSharpness, sharpnessScore, 0, 100),
            number(analysis.endingSharpness, sharpnessScore, 0, 100)
          );

        const architectureChanged =
          analysis.architectureChanged === true;

        const geometryWarpDetected =
          analysis.geometryWarpDetected === true;

        const furnitureOrFixtureChanged =
          analysis.furnitureOrFixtureChanged === true;

        const vegetationDriftDetected =
          analysis.vegetationDriftDetected === true;

        const hallucinationFailure =
          architectureChanged ||
          geometryWarpDetected ||
          furnitureOrFixtureChanged ||
          vegetationDriftDetected;

        const pass =
          analysis.pass === true &&
          score >= passingScore &&
          !hallucinationFailure &&
          minimumFrameSharpness >= 90 &&
          analysis.openingBlurDetected !== true &&
          analysis.middleBlurDetected !== true &&
          analysis.endingBlurDetected !== true;

        const result:
          AttemptResult = {
          attemptNumber,
          status: pass
            ? "passed"
            : "failed",
          videoUrl:
            generation.data.videoUrl,
          taskId:
            text(
              generation.data.taskId
            ),
          overallScore: score,
          sharpnessScore,
          minimumFrameSharpness,
          motionScore,
          architectureChanged,
          geometryWarpDetected,
          furnitureOrFixtureChanged,
          vegetationDriftDetected,
          hallucinationFailure,
          pass,
          problems:
            stringList(
              analysis.problems,
              25
            ),
          strengths:
            stringList(
              analysis.strengths,
              20
            ),
          retryPrompt:
            text(
              analysis.retryPrompt
            ),
          runtimeSeconds:
            Number(
              (
                (Date.now() -
                  attemptStartedAt) /
                1000
              ).toFixed(1)
            ),
          generationMessage:
            text(
              generation.data.message
            ),
          qualityMessage:
            text(
              quality.data.message
            ),
        };

        attempts.push(result);

        previousRetryPrompt =
          result.retryPrompt;

        previousProblems =
          result.problems;

        if (pass) {
          break;
        }
      } catch (error) {
        attempts.push({
          attemptNumber,
          status: "error",
          videoUrl: "",
          taskId: "",
          overallScore: 0,
          sharpnessScore: 0,
          minimumFrameSharpness: 0,
          motionScore: 0,
          architectureChanged: false,
          geometryWarpDetected: false,
          furnitureOrFixtureChanged: false,
          vegetationDriftDetected: false,
          hallucinationFailure: true,
          pass: false,
          problems: [
            error instanceof Error
              ? error.message
              : "Unknown retry attempt error.",
          ],
          strengths: [],
          retryPrompt: "",
          runtimeSeconds:
            Number(
              (
                (Date.now() -
                  attemptStartedAt) /
                1000
              ).toFixed(1)
            ),
          generationMessage: "",
          qualityMessage: "",
        });
      }
    }

    const successfulAttempts =
      attempts.filter(
        (attempt) =>
          attempt.videoUrl &&
          attempt.status !== "error"
      );

    if (
      successfulAttempts.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All retry attempts failed before producing a usable clip.",
          attempts,
          totalRuntimeSeconds:
            Number(
              (
                (Date.now() -
                  startedAt) /
                1000
              ).toFixed(1)
            ),
        },
        { status: 502 }
      );
    }

    const bestAttempt =
      [...successfulAttempts].sort(
        (a, b) => {
          if (
            a.hallucinationFailure !==
            b.hallucinationFailure
          ) {
            return a.hallucinationFailure ? 1 : -1;
          }

          const minimumSharpnessDifference =
            b.minimumFrameSharpness -
            a.minimumFrameSharpness;

          if (minimumSharpnessDifference !== 0) {
            return minimumSharpnessDifference;
          }

          const sharpnessDifference =
            b.sharpnessScore -
            a.sharpnessScore;

          if (sharpnessDifference !== 0) {
            return sharpnessDifference;
          }

          const overallDifference =
            b.overallScore -
            a.overallScore;

          if (overallDifference !== 0) {
            return overallDifference;
          }

          return b.motionScore - a.motionScore;
        }
      )[0];

    return NextResponse.json({
      success: true,
      passed:
        bestAttempt.pass,
      bestAttempt,
      attempts,
      totalAttempts:
        attempts.length,
      totalRuntimeSeconds:
        Number(
          (
            (Date.now() -
              startedAt) /
            1000
          ).toFixed(1)
        ),
      message:
        bestAttempt.pass
          ? `Clip passed on attempt ${bestAttempt.attemptNumber} with a score of ${bestAttempt.overallScore}.`
          : `No attempt reached the passing score. Returning the best clip from attempt ${bestAttempt.attemptNumber} with a score of ${bestAttempt.overallScore}.`,
    });
  } catch (error) {
    console.error(
      "WalkNWow Retry Manager error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Retry Manager failed.",
      },
      { status: 500 }
    );
  }
}