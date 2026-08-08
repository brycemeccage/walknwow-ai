import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type SceneInput = {
  photoNumber?: number;
  category?: string;
  roomLabel?: string;
  storyRole?: string;
  visibleFeatures?: string[];
  preservationRules?: string[];
  transitionIntent?: string;
  distortionRisk?: "low" | "medium" | "high";
  blurRisk?: "low" | "medium" | "high";
  criticalArchitecture?: string[];
  lockedObjects?: string[];
};

type GenerateAllRequest = {
  images?: unknown;
  scenes?: unknown;
  propertyDNA?: unknown;
  upscale?: unknown;
};

type GeneratedClip = {
  imageUrl: string;
  videoUrl: string;
  originalVideoUrl: string;
  photoNumber: number;
  qualityScore: number;
  sharpnessScore: number;
  minimumFrameSharpness: number;
  upscaled: boolean;
};

type FailedClip = {
  imageUrl: string;
  photoNumber: number;
  error: string;
};

type RetryResponse = {
  success?: boolean;
  bestAttempt?: {
    videoUrl?: string;
    overallScore?: number;
    sharpnessScore?: number;
    minimumFrameSharpness?: number;
  };
  message?: string;
};

type UpscaleResponse = {
  success?: boolean;
  upscaledVideoUrl?: string;
  message?: string;
};

async function postJson<T>(
  url: string,
  body: unknown
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

function validImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      /^https?:\/\//i.test(item)
  );
}

function validScenes(value: unknown): SceneInput[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is SceneInput =>
      typeof item === "object" &&
      item !== null
  );
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as GenerateAllRequest;

    const images = validImages(body.images);
    const scenes = validScenes(body.scenes);

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No selected property images were received.",
        },
        { status: 400 }
      );
    }

    const origin =
      new URL(request.url).origin;

    const retryUrl =
      `${origin}/api/walkthroughs/retry-manager`;

    const upscaleUrl =
      `${origin}/api/upscale-video`;

    /*
     * IMPORTANT:
     * There is intentionally no slice(0, 3) and no fixed scene count here.
     * This route processes exactly the images the Director/UI sends it.
     */
    const selectedImages = images;

    const generatedClips:
      GeneratedClip[] = [];

    const failedClips:
      FailedClip[] = [];

    const shouldUpscale =
      body.upscale === true;

    for (
      let index = 0;
      index < selectedImages.length;
      index += 1
    ) {
      const imageUrl =
        selectedImages[index];

      const scene =
        scenes[index] ?? {};

      const photoNumber =
        typeof scene.photoNumber === "number"
          ? scene.photoNumber
          : index + 1;

      try {
        const retry =
          await postJson<RetryResponse>(
            retryUrl,
            {
              imageUrl,
              category:
                scene.category ?? "other",
              scene,
              propertyDNA:
                body.propertyDNA ?? {},
              maxAttempts: 3,
              passingScore: 90,
            }
          );

        const originalVideoUrl =
          retry.bestAttempt?.videoUrl;

        if (
          !retry.success ||
          typeof originalVideoUrl !== "string" ||
          !originalVideoUrl
        ) {
          throw new Error(
            retry.message ||
              "Retry manager returned no usable clip."
          );
        }

        let finalVideoUrl =
          originalVideoUrl;

        let upscaled = false;

        /*
         * Upscaling is opt-in here.
         * For a rough draft, generate/quality-check first.
         * Upscale accepted clips later so a long listing does not
         * spend the entire request waiting on upscale tasks.
         */
        if (shouldUpscale) {
          const upscale =
            await postJson<UpscaleResponse>(
              upscaleUrl,
              {
                videoUrl:
                  originalVideoUrl,
                resolution: "2k",
              }
            );

          if (
            upscale.success &&
            typeof upscale.upscaledVideoUrl ===
              "string" &&
            upscale.upscaledVideoUrl
          ) {
            finalVideoUrl =
              upscale.upscaledVideoUrl;
            upscaled = true;
          }
        }

        generatedClips.push({
          imageUrl,
          originalVideoUrl,
          videoUrl: finalVideoUrl,
          photoNumber,
          qualityScore:
            retry.bestAttempt
              ?.overallScore ?? 0,
          sharpnessScore:
            retry.bestAttempt
              ?.sharpnessScore ?? 0,
          minimumFrameSharpness:
            retry.bestAttempt
              ?.minimumFrameSharpness ?? 0,
          upscaled,
        });
      } catch (error) {
        failedClips.push({
          imageUrl,
          photoNumber,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success:
        generatedClips.length > 0,
      clips: generatedClips,
      failures: failedClips,
      completedCount:
        generatedClips.length,
      failedCount:
        failedClips.length,
      requestedCount:
        selectedImages.length,
      qualityControlled: true,
      upscaleRequested:
        shouldUpscale,
      message:
        `Generated ${generatedClips.length} of ${selectedImages.length} selected clips.`,
    });
  } catch (error) {
    console.error(
      "Generate-all-clips error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}
