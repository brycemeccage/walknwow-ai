import RunwayML from "@runwayml/sdk";
import { NextResponse } from "next/server";

type GenerateClipRequest = {
  imageUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateClipRequest;
    const imageUrl = body.imageUrl?.trim();

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
          message: "Runway API key is missing or invalid.",
        },
        { status: 500 }
      );
    }

    const runway = new RunwayML({
      apiKey,
    });

    const promptText =
      "Create a photorealistic real estate video from this exact image. Preserve the architecture, furniture, landscaping, colors, lighting, textures, proportions, and perspective exactly. Do not add, remove, warp, stretch, redesign, or invent anything. Use only a slow cinematic push-in with minimal movement. No orbiting, no dramatic panning, and no artificial zoom effects. Accuracy is more important than motion.";

    const task = await runway.imageToVideo
      .create({
        model: "gen4.5",
        promptImage: imageUrl,
        promptText,
        ratio: "1280:720",
        duration: 5,
      })
      .waitForTaskOutput();

    const videoUrl = task.output?.[0];

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Runway finished but did not return a video URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      videoUrl,
    });
  } catch (error) {
    console.error("Runway generate-clip error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The clip could not be generated.",
      },
      { status: 500 }
    );
  }
}