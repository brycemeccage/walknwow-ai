import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { productionStudio } from "../../../engines/production-studio";
import type { Photo } from "../../../engines/director/director-types";

export const runtime = "nodejs";
export const maxDuration = 300;

type RequestBody = {
  listingUrl?: unknown;
  photos?: unknown;
};

function validPhotos(value: unknown): Photo[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is Photo => {
    if (!item || typeof item !== "object") return false;

    const photo = item as Partial<Photo>;

    return (
      Number.isInteger(photo.photoNumber) &&
      typeof photo.category === "string" &&
      typeof photo.quality === "number" &&
      typeof photo.story === "number" &&
      Array.isArray(photo.features)
    );
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const listingUrl =
      typeof body.listingUrl === "string"
        ? body.listingUrl.trim()
        : "";

    const photos = validPhotos(body.photos);

    if (!listingUrl) {
      return NextResponse.json(
        { success: false, message: "listingUrl is required." },
        { status: 400 }
      );
    }

    if (photos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one analyzed photo is required.",
        },
        { status: 400 }
      );
    }

    const result = await productionStudio.run({
      jobId: randomUUID(),
      listingUrl,
      photos,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("WalkNWow production route error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Production Studio failed.",
      },
      { status: 500 }
    );
  }
}