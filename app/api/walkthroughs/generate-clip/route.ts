import RunwayML from "@runwayml/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { mapCategoryToCinematography } from "@/lib/cinematography/profile-mapper";
import { buildCinematographyPrompt } from "@/lib/cinematography/prompt-builder";
import {
  buildPropertyLock,
  mergePropertyLockIntoPrompt,
  summarizePropertyLock,
} from "@/lib/director/property-lock";
import {
  buildSceneLifePlan,
  mergeSceneLifeIntoPrompt,
  summarizeSceneLife,
} from "@/lib/director/scene-life";
export const runtime = "nodejs";
export const maxDuration = 300;

type RiskLevel = "low" | "medium" | "high";

type PropertyDNA = {
  propertyType?: string;
  architecturalStyle?: string;
  luxuryLevel?: string;
  standoutFeatures?: string[];
  continuityRules?: string[];
  exterior?: Record<string, unknown>;
  interior?: Record<string, unknown>;
  kitchen?: Record<string, unknown>;
  livingAreas?: Record<string, unknown>;
  bedrooms?: Record<string, unknown>;
  bathrooms?: Record<string, unknown>;
  outdoor?: Record<string, unknown>;
};

type DirectorScene = {
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

type GenerateClipRequest = {
  imageUrl?: string;
  category?: string;
  scene?: DirectorScene;
  propertyDNA?: PropertyDNA;
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

function known(value: unknown): string {
  const result = text(value);

  if (
    !result ||
    result.toLowerCase() ===
      "not clearly visible" ||
    result.toLowerCase() ===
      "not analyzed" ||
    result.toLowerCase() ===
      "preserve source imagery"
  ) {
    return "";
  }

  return result;
}

function flattenFacts(
  section: unknown
): string[] {
  if (
    typeof section !== "object" ||
    section === null
  ) {
    return [];
  }

  return Object.entries(
    section as Record<string, unknown>
  )
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        const items = value
          .filter(
            (item): item is string =>
              typeof item === "string" &&
              item.trim().length > 0
          )
          .map((item) => item.trim());

        return items.length > 0
          ? [`${key}: ${items.join(", ")}`]
          : [];
      }

      const cleaned = known(value);

      return cleaned
        ? [`${key}: ${cleaned}`]
        : [];
    })
    .slice(0, 20);
}

function buildPropertyIdentity(
  dna: PropertyDNA
): string {
  const headline = [
    known(dna.propertyType),
    known(dna.architecturalStyle),
    known(dna.luxuryLevel),
  ].filter(Boolean);

  const details = [
    ...flattenFacts(dna.exterior),
    ...flattenFacts(dna.interior),
    ...flattenFacts(dna.kitchen),
    ...flattenFacts(dna.livingAreas),
    ...flattenFacts(dna.bedrooms),
    ...flattenFacts(dna.bathrooms),
    ...flattenFacts(dna.outdoor),
    ...stringList(
      dna.standoutFeatures,
      15
    ),
  ].slice(0, 35);

  const combined = [
    headline.join("; "),
    details.join("; "),
  ]
    .filter(Boolean)
    .join(". ");

  return combined ||
    "Preserve the exact visual identity shown in the source image.";
}

function mimeFromExtension(
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

async function resolvePromptImage(
  imageUrl: string
): Promise<string> {
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

  return `data:${mime};base64,${buffer.toString(
    "base64"
  )}`;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as GenerateClipRequest;

    const imageUrl = text(body.imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An image URL is required.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env
        .RUNWAYML_API_SECRET
        ?.trim();

    if (
      !apiKey ||
      !apiKey.startsWith("key_")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "RUNWAYML_API_SECRET is missing or invalid.",
        },
        { status: 500 }
      );
    }

    const scene =
      body.scene &&
      typeof body.scene === "object"
        ? body.scene
        : {};

    const category =
      text(
        scene.category ??
          body.category,
        "other"
      );

    const profile =
      mapCategoryToCinematography(
        category
      );

    const dna =
      body.propertyDNA &&
      typeof body.propertyDNA === "object"
        ? body.propertyDNA
        : {};

    const roomLabel = text(
      scene.roomLabel,
      profile.room.label
    );

    const visibleFeatures =
      stringList(
        scene.visibleFeatures,
        15
      );

    const propertyIdentity =
      buildPropertyIdentity(dna);

    const propertyLock =
      buildPropertyLock({
        category,
        roomLabel,
        visibleFeatures,
        preservationRules:
          stringList(
            scene.preservationRules,
            20
          ),
        propertyIdentity,
        criticalArchitecture:
          stringList(
            scene.criticalArchitecture,
            15
          ),
        lockedObjects:
          stringList(
            scene.lockedObjects,
            20
          ),
      });

    const basePrompt =
      buildCinematographyPrompt({
        profile,
        roomLabel,
        storyRole: text(
          scene.storyRole,
          "property walkthrough scene"
        ),
        visibleFeatures,
        propertyIdentity,
        continuityRules:
          stringList(
            dna.continuityRules,
            25
          ),
        preservationRules:
          stringList(
            scene.preservationRules,
            20
          ),
      });

    const propertyPrompt =
      mergePropertyLockIntoPrompt(
        basePrompt,
        propertyLock,
        950
      );

    const sceneLifePlan =
      buildSceneLifePlan({
        category,
        roomLabel,
        visibleFeatures,
        lockedObjects:
          propertyLock.lockedObjects,
        criticalArchitecture:
          propertyLock.criticalArchitecture,
      });

    const baseScenePrompt =
      mergeSceneLifeIntoPrompt(
        propertyPrompt,
        sceneLifePlan,
        950
      );

    const motionAmount =
      scene.distortionRisk === "high" ||
      scene.blurRisk === "high"
        ? "micro"
        : "subtle";

    const walkthroughRules =
      motionAmount === "micro"
        ? "Use a tiny stabilized forward camera translation with real subtle parallax only inside geometry already supported by the source image. Keep framing conservative. Do not pan, orbit, zoom, crop-drift, reveal around corners, or expose hidden areas."
        : "Use a slow stabilized forward camera translation with restrained natural parallax only inside geometry already supported by the source image. Keep framing conservative. Do not pan, orbit, zoom, crop-drift, reveal around corners, or expose hidden areas.";

    const visibilityLock =
      "SOURCE-VISIBILITY LOCK: the source photograph is the complete visual truth. Motion may reproject visible surfaces but must not expose, complete, extrapolate, or invent anything hidden behind furniture, walls, doors, counters, islands, trees, frame edges, or foreground objects. If motion would require guessing newly visible content, reduce travel distance instead.";

    const objectLock =
      "IDENTITY LOCK: preserve exact object count, placement, shape, size, color, material, texture, fixtures, furniture, cabinetry, windows, doors, reflections, trees, trunks, branches, foliage silhouettes, grass, fences, decks, horizon, and window views. Objects may shift on screen only from true camera parallax. Nothing may independently move, appear, disappear, morph, split, merge, restage, redesign, or regenerate.";

    const sharpnessLock =
      "SHARPNESS LOCK: opening, middle, and ending must be equally crisp. No focus settling, focus pull, depth-of-field blur, motion smear, texture softening, shimmer, crawling detail, exposure shift, or sharpening ramp.";

    const promptText =
      `${baseScenePrompt.slice(0, 150)} ${walkthroughRules} ${visibilityLock} ${objectLock} ${sharpnessLock}`.slice(0, 995);

    const propertyLockSummary =
      summarizePropertyLock(
        propertyLock
      );

    const sceneLifeSummary =
      summarizeSceneLife(
        sceneLifePlan
      );

    const promptImage =
      await resolvePromptImage(
        imageUrl
      );

    const runway = new RunwayML({
      apiKey,
    });

    const task =
      await runway.imageToVideo
        .create({
          model: "gen4.5",
          promptImage,
          promptText,
          ratio: "1280:720",
          duration: 5,
        })
        .waitForTaskOutput();

    const videoUrl =
      task.output?.[0];

    if (
      typeof videoUrl !== "string" ||
      !videoUrl.trim()
    ) {
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
      category,
      productionPreset: {
        key: "preset_a",
        label: "Visibility-Locked Walkthrough 5s",
        durationSeconds: 5,
        cameraBehavior: "stabilized_forward_translation",
        motionBehavior:
          "visibility_locked_walkthrough_parallax",
      },
      propertyLock: {
        ...propertyLockSummary,
        criticalArchitecture:
          propertyLock.criticalArchitecture,
        lockedObjects:
          propertyLock.lockedObjects,
        qualityChecklist:
          propertyLock.qualityChecklist,
      },
      sceneLife: {
        ...sceneLifeSummary,
        qualityChecklist:
          sceneLifePlan.qualityChecklist,
      },
      cinematography: {
        cameraProfile:
          profile.camera.key,
        roomProfile:
          profile.room.category,
        lens:
          profile.lens.equivalentFocalLength,
        movement:
          profile.movement.key,
        motionBudget:
          profile.motionBudget,
        durationSeconds: 5,
        qualityRisk:
          profile.qualityRisk,
      },
    });
  } catch (error) {
    console.error(
      "WalkNWow generate-clip error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The AI clip could not be generated.",
      },
      { status: 500 }
    );
  }
}