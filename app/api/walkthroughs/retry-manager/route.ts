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
      "REFERENCE STANDARD: create a crisp professional real-estate walkthrough, not a moving still image.",
      "Use a slow stabilized forward camera translation with subtle real parallax between foreground and background.",
      "Keep the opening, middle, and ending equally sharp and resolved.",
      "Do not use a flat zoom, Ken Burns effect, panoramic still-image pan, focus pull, depth-of-field blur, or motion smear.",
      "Preserve the exact source property. Do not add, remove, move, restage, redesign, or invent anything.",
      "Keep architecture, furniture, decor, small objects, materials, reflections, trees, branches, landscaping, and window views stable.",
    ];
  }

  if (attemptNumber === 2) {
    return [
      "QUALITY RETRY: match the best crisp walkthrough attempts.",
      "Keep a real slow forward camera translation with subtle parallax; reduce travel distance only enough to maintain perfect sharpness and fidelity.",
      "Opening, middle, and ending must all remain crisp. No focus settling, softening, motion smear, texture loss, or blurry transition.",
      "Do not replace walkthrough motion with a static tripod, flat zoom, or panoramic photo movement.",
      "Preserve exact architecture, geometry, furniture, object count, materials, reflections, trees, branches, landscaping, and exterior views.",
      previousRetryPrompt,
      ...previousProblems.map(
        (problem) =>
          `Correct this previous failure without sacrificing sharp walkthrough motion: ${problem}`
      ),
    ].filter(Boolean);
  }

  return [
    "FINAL REFERENCE RETRY: prioritize the same balance as the best successful clips: crisp source fidelity plus a small but unmistakable forward walkthrough translation.",
    "Use minimal stabilized forward travel with real parallax. Do not become a still image, flat zoom, pan, orbit, or locked tripod.",
    "Every frame must stay sharp from start through middle to end.",
    "No focus pull, motion blur, smear, texture regeneration, shimmer, morphing, or exposure shift.",
    "Do not add, remove, move, recolor, resize, replace, redesign, or invent anything.",
    "Lock architecture, furniture, small objects, textures, trees, branches, foliage silhouettes, landscaping, reflections, and window views to the source.",
    previousRetryPrompt,
    ...previousProblems.map(
      (problem) =>
        `Eliminate this prior issue while preserving subtle real walkthrough parallax: ${problem}`
    ),
  ].filter(Boolean);
}

async function postJson<T>(
  url: string,
  body: unknown,
  inboundRequest: Request
): Promise<{
  ok: boolean;
  status: number;
  data: T;
}> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  /*
   * Retry Manager calls sibling API routes through the same deployed
   * Vercel origin. Forward the inbound authentication/session headers
   * so Deployment Protection does not reject those internal requests
   * with 401 before generate-clip or quality can run.
   */
  const forwardedHeaderNames = [
    "authorization",
    "cookie",
    "x-vercel-protection-bypass",
    "x-vercel-set-bypass-cookie",
  ];

  for (const name of forwardedHeaderNames) {
    const value =
      inboundRequest.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
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

async function wait(
  milliseconds: number
): Promise<void> {
  await new Promise(
    (resolve) =>
      setTimeout(resolve, milliseconds)
  );
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

      let generatedVideoUrl = "";
      let generatedTaskId = "";
      let generationMessage = "";

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
            },
            request
          );

        generatedVideoUrl =
          text(
            generation.data.videoUrl
          );

        generatedTaskId =
          text(
            generation.data.taskId
          );

        generationMessage =
          text(
            generation.data.message
          );

        if (
          !generation.ok ||
          !generation.data.success ||
          !generatedVideoUrl
        ) {
          throw new Error(
            generation.data.message ||
              `Generation failed with status ${generation.status}.`
          );
        }

        try {
          const quality =
            await postJson<QualityResponse>(
              qualityUrl,
              {
                sourceImageUrl:
                  imageUrl,
                videoUrl:
                  generatedVideoUrl,
                category,
                distortionRisk:
                  attemptScene.distortionRisk,
                blurRisk:
                  attemptScene.blurRisk,
                propertyLock:
                  generation.data
                    .propertyLock,
              },
              request
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
              number(
                analysis.openingSharpness,
                sharpnessScore,
                0,
                100
              ),
              number(
                analysis.middleSharpness,
                sharpnessScore,
                0,
                100
              ),
              number(
                analysis.endingSharpness,
                sharpnessScore,
                0,
                100
              )
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

          const referenceQualityScore =
            minimumFrameSharpness * 0.45 +
            sharpnessScore * 0.25 +
            motionScore * 0.20 +
            score * 0.10;

          const pass =
            analysis.pass === true &&
            score >= passingScore &&
            sharpnessScore >= 92 &&
            minimumFrameSharpness >= 90 &&
            motionScore >= 84 &&
            referenceQualityScore >= 90 &&
            !hallucinationFailure &&
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
              generatedVideoUrl,
            taskId:
              generatedTaskId,
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
            generationMessage,
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
        } catch (qualityError) {
          /*
           * Important: generation succeeded. Do not throw away a real clip
           * just because the quality-inspection route had a transient failure.
           * Keep it as an unverified fallback and continue retrying.
           */
          attempts.push({
            attemptNumber,
            status: "failed",
            videoUrl:
              generatedVideoUrl,
            taskId:
              generatedTaskId,
            overallScore: 1,
            sharpnessScore: 1,
            minimumFrameSharpness: 1,
            motionScore: 1,
            architectureChanged: false,
            geometryWarpDetected: false,
            furnitureOrFixtureChanged: false,
            vegetationDriftDetected: false,
            hallucinationFailure: false,
            pass: false,
            problems: [
              qualityError instanceof Error
                ? `Quality inspection unavailable: ${qualityError.message}`
                : "Quality inspection unavailable.",
            ],
            strengths: [
              "Generation completed and returned a playable clip.",
            ],
            retryPrompt:
              "Retry with the same property lock and conservative source-boundary motion.",
            runtimeSeconds:
              Number(
                (
                  (Date.now() -
                    attemptStartedAt) /
                  1000
                ).toFixed(1)
              ),
            generationMessage,
            qualityMessage:
              "Quality inspection failed; clip retained as an unverified fallback.",
          });

          previousProblems = [
            "Quality inspection was unavailable. Keep the next attempt conservative and faithful.",
          ];
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
          generationMessage,
          qualityMessage: "",
        });
      }

      if (
        attemptNumber <
        maxAttempts
      ) {
        await wait(
          750 * attemptNumber
        );
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
            "All generation attempts failed before returning any video URL. Check the attempt errors for the upstream generation failure.",
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
          if (a.pass !== b.pass) {
            return a.pass ? -1 : 1;
          }

          if (
            a.hallucinationFailure !==
            b.hallucinationFailure
          ) {
            return a.hallucinationFailure
              ? 1
              : -1;
          }

          const aReferenceScore =
            a.minimumFrameSharpness * 0.45 +
            a.sharpnessScore * 0.25 +
            a.motionScore * 0.20 +
            a.overallScore * 0.10;

          const bReferenceScore =
            b.minimumFrameSharpness * 0.45 +
            b.sharpnessScore * 0.25 +
            b.motionScore * 0.20 +
            b.overallScore * 0.10;

          const referenceDifference =
            bReferenceScore -
            aReferenceScore;

          if (referenceDifference !== 0) {
            return referenceDifference;
          }

          const motionDifference =
            b.motionScore -
            a.motionScore;

          if (motionDifference !== 0) {
            return motionDifference;
          }

          return (
            b.overallScore -
            a.overallScore
          );
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