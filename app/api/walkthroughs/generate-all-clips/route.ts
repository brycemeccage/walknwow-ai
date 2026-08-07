import RunwayML from "@runwayml/sdk";
import { NextResponse } from "next/server";

type GeneratedClip = {
  imageUrl: string;
  videoUrl: string;
  photoNumber: number;
};

type FailedClip = {
  imageUrl: string;
  photoNumber: number;
  error: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const images = body.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No property images were received.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RUNWAYML_API_SECRET?.trim();

    if (!apiKey || !apiKey.startsWith("key_")) {
      return NextResponse.json(
        {
          success: false,
          message: "Runway API key is missing or invalid.",
        },
        { status: 500 }
      );
    }

    const runway = new RunwayML({
      apiKey,
    });

    // Only generate the first 3 for testing
    const selectedImages = images.slice(0, 3);

    console.log("Selected images:", selectedImages.length);

    const generatedClips: GeneratedClip[] = [];
    const failedClips: FailedClip[] = [];

    for (let index = 0; index < selectedImages.length; index++) {
      const imageUrl = selectedImages[index];

      console.log(
        `Starting clip ${index + 1} of ${selectedImages.length}`
      );

      try {
        const task = await runway.imageToVideo
          .create({
            model: "gen4.5",
            promptImage: imageUrl,
            promptText:
              "Slow, smooth cinematic real-estate camera movement. Preserve the exact architecture. No added objects. No removed objects.",
            ratio: "1280:720",
            duration: 5,
          })
          .waitForTaskOutput();

        const videoUrl = task.output?.[0];

        if (!videoUrl) {
          failedClips.push({
            imageUrl,
            photoNumber: index + 1,
            error: "No video returned.",
          });

          continue;
        }

        generatedClips.push({
          imageUrl,
          videoUrl,
          photoNumber: index + 1,
        });

        console.log(
          `Finished clip ${index + 1} of ${selectedImages.length}`
        );
      } catch (error) {
        console.error(error);

        failedClips.push({
          imageUrl,
          photoNumber: index + 1,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    console.log("Generated clips:", generatedClips.length);

    return NextResponse.json({
      success: true,
      clips: generatedClips,
      failures: failedClips,
      completedCount: generatedClips.length,
      failedCount: failedClips.length,
      requestedCount: selectedImages.length,
      message: `Generated ${generatedClips.length} of ${selectedImages.length} clips.`,
    });
  } catch (error) {
    console.error(error);

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