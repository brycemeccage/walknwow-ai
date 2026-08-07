import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import {
  orchestrateFullProduction,
  type FullProductionInput,
} from "../../../../engines/production-studio";

import type { Photo } from "../../../../engines/director/director-types";
import type { RealtorBranding } from "../../../../engines/branding";
import type {
  ExportAspect,
  ExportPreset,
} from "../../../../engines/export";

export const runtime = "nodejs";
export const maxDuration = 300;

type RequestBody = {
  listingUrl?: unknown;
  photos?: unknown;
  generatedClips?: unknown;
  propertyType?: unknown;
  standoutFeatures?: unknown;
  branding?: unknown;
  exportPreset?: unknown;
  exportAspect?: unknown;
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

function validGeneratedClips(
  value: unknown
): FullProductionInput["generatedClips"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is {
      photoNumber: number;
      videoUrl: string;
      roomLabel?: string;
      category?: string;
      qualityScore?: number;
      storytellingScore?: number;
    } => {
      if (!item || typeof item !== "object") return false;
      const clip = item as Record<string, unknown>;

      return (
        Number.isInteger(clip.photoNumber) &&
        typeof clip.videoUrl === "string" &&
        clip.videoUrl.trim().length > 0
      );
    })
    .map((clip) => ({
      photoNumber: clip.photoNumber,
      videoUrl: clip.videoUrl.trim(),
      roomLabel:
        typeof clip.roomLabel === "string"
          ? clip.roomLabel
          : undefined,
      category:
        typeof clip.category === "string"
          ? clip.category
          : undefined,
      qualityScore:
        typeof clip.qualityScore === "number"
          ? clip.qualityScore
          : undefined,
      storytellingScore:
        typeof clip.storytellingScore === "number"
          ? clip.storytellingScore
          : undefined,
    }));
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

function brandingFrom(
  value: unknown
): RealtorBranding | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const raw = value as Record<string, unknown>;

  const realtorName =
    typeof raw.realtorName === "string"
      ? raw.realtorName.trim()
      : "";

  if (!realtorName) return undefined;

  return {
    realtorName,
    title:
      typeof raw.title === "string"
        ? raw.title
        : undefined,
    phone:
      typeof raw.phone === "string"
        ? raw.phone
        : undefined,
    email:
      typeof raw.email === "string"
        ? raw.email
        : undefined,
    website:
      typeof raw.website === "string"
        ? raw.website
        : undefined,
    brokerageName:
      typeof raw.brokerageName === "string"
        ? raw.brokerageName
        : undefined,
    logoUrl:
      typeof raw.logoUrl === "string"
        ? raw.logoUrl
        : undefined,
    headshotUrl:
      typeof raw.headshotUrl === "string"
        ? raw.headshotUrl
        : undefined,
    qrCodeUrl:
      typeof raw.qrCodeUrl === "string"
        ? raw.qrCodeUrl
        : undefined,
    callToAction:
      typeof raw.callToAction === "string"
        ? raw.callToAction
        : undefined,
  };
}

function exportPresetFrom(value: unknown): ExportPreset {
  return value === "express" ||
    value === "standard" ||
    value === "luxury" ||
    value === "ultra"
    ? value
    : "luxury";
}

function exportAspectFrom(value: unknown): ExportAspect {
  return value === "9:16" || value === "1:1"
    ? value
    : "16:9";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const listingUrl =
      typeof body.listingUrl === "string"
        ? body.listingUrl.trim()
        : "";

    const photos = validPhotos(body.photos);
    const generatedClips = validGeneratedClips(body.generatedClips);

    if (!listingUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "listingUrl is required.",
        },
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

    if (generatedClips.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one generated clip is required.",
        },
        { status: 400 }
      );
    }

    const input: FullProductionInput = {
      jobId: randomUUID(),
      listingUrl,
      photos,
      generatedClips,
      propertyType:
        typeof body.propertyType === "string"
          ? body.propertyType
          : undefined,
      standoutFeatures: stringList(body.standoutFeatures),
      branding: brandingFrom(body.branding),
      exportPreset: exportPresetFrom(body.exportPreset),
      exportAspect: exportAspectFrom(body.exportAspect),
    };

    const result = await orchestrateFullProduction(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "WalkNWow full production route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Full production failed.",
      },
      { status: 500 }
    );
  }
}
