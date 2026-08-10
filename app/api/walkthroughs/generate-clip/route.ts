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

    const normalizedCategory =
      category.toLowerCase();

    const normalizedRoomLabel =
      roomLabel.toLowerCase();

    const isKitchen =
      /kitchen|breakfast|pantry/.test(
        `${normalizedCategory} ${normalizedRoomLabel}`
      );

    const isBedroom =
      /bedroom|primary suite|master suite/.test(
        `${normalizedCategory} ${normalizedRoomLabel}`
      );

    const isOpenPlan =
      /open concept|open-plan|open plan|great room|living kitchen|kitchen living/.test(
        `${normalizedCategory} ${normalizedRoomLabel} ${visibleFeatures.join(" ").toLowerCase()}`
      );

    const isHighRisk =
      scene.distortionRisk === "high" ||
      scene.blurRisk === "high" ||
      isKitchen ||
      isOpenPlan;

    const motionAmount =
      isHighRisk
        ? "micro"
        : "subtle";

    /*
     * REALISM-FIRST CAMERA POLICY
     *
     * The source photograph is a 2D observation, not a complete 3D world.
     * Prefer a smaller believable move over a larger move that forces the
     * video model to invent unseen geometry.
     */
    const cameraRule =
      motionAmount === "micro"
        ? "REALISM CAMERA: use an extremely small stabilized push-in, approximately 1 percent of visible scene depth. Create only gentle parallax from surfaces already fully visible in the source image. If safe parallax is not possible, use an almost-static stabilized hold with tiny natural camera drift. Do not force forward motion."
        : "REALISM CAMERA: use a very small stabilized push-in, approximately 1-2 percent of visible scene depth. Create only gentle parallax from surfaces already fully visible in the source image. Prefer less movement over any invented geometry. If the move approaches an occlusion, crop edge, doorway, corner, or unknown area, immediately stop forward travel.";

    const sourceBoundaryRule =
      "ABSOLUTE 2D SOURCE BOUNDARY: treat the source photograph as the complete and final visual world. There is NO valid scene information outside the photographed pixels and NO hidden geometry may be inferred. Never reveal pixels that would require seeing farther left, right, above, below, behind, around, through, or beyond anything visible in the source. Never extend the room, exterior, landscape, floor, ceiling, wall, deck, yard, water, sky, or neighboring area beyond what the photograph explicitly shows.";

    const occlusionRule =
      "OCCLUSION LOCK: doorways, halls, openings, corners, wall edges, cabinet edges, island edges, appliance edges, furniture edges, railings, trees, foreground objects, frame edges, and cropped objects are hard stopping planes. Never move through them. Never look around them. Never expose their hidden back side. Never complete a cropped object. Never reveal an adjoining room or unseen continuation of a space. What is hidden in the source must remain hidden for the entire clip.";

    const kitchenRule =
      isKitchen || isOpenPlan
        ? "KITCHEN / OPEN-PLAN HARD LOCK: do not interpret any doorway, hallway, island gap, cabinet edge, counter edge, appliance gap, dark opening, reflective surface, or cropped wall as a path into another room. Do not create a new room, pantry, hallway, doorway, cabinet run, wall continuation, appliance, window, or countertop beyond what is visible. Keep the camera nearly stationary if necessary. The kitchen must remain exactly the same finite space shown in the source."
        : "";

    const compositionRule =
      "COMPOSITION LOCK: keep the same overall framing, lens character, perspective, room proportions, horizon, and visible content as the source. The ending frame must still look unmistakably like the same photograph from only a slightly advanced camera position. Do not widen the field of view, zoom out, orbit, pan around a corner, rotate to discover new content, or create a new camera angle.";

    const identityRule =
      "PROPERTY IDENTITY LOCK: preserve every visible architectural line, wall, ceiling, floor, window, door, cabinet, countertop, appliance, fixture, furnishing, decor item, reflection, tree trunk, branch, foliage silhouette, grass area, fence, deck, shoreline, water shape, horizon, and exterior view. Preserve exact object count, placement, shape, size, color, material, and texture. Nothing may appear, disappear, move independently, morph, split, merge, restage, redesign, regenerate, or be replaced.";

    const lightingRule =
      isBedroom
        ? "BEDROOM LIGHTING LOCK: preserve the exact source exposure, white balance, daylight direction, window brightness, lamp state, shadow placement, color temperature, and contrast. Do not brighten or darken the room over time. Do not turn lamps or fixtures on or off. Do not create moving sunlight, changing window light, glow, flicker, exposure pumping, or cinematic relighting."
        : "LIGHTING LOCK: preserve the exact source exposure, white balance, daylight direction, window brightness, fixture state, shadow placement, color temperature, and contrast from beginning to end. No lights turning on or off, no exposure ramp, no changing sunlight, no cinematic relighting, no glow changes, and no flicker.";

    const temporalRule =
      "TEMPORAL REALISM: opening, middle, and ending frames must remain equally crisp and structurally consistent. No focus settling, depth-of-field blur, motion smear, texture crawling, shimmer, melting, geometry breathing, foliage regeneration, exposure pumping, sharpening ramp, or frame-to-frame redesign.";

    const realismRule =
      "PHOTOREALISM LOCK: preserve natural real-estate photography. Do not beautify, stylize, dramatize, add cinematic haze, change materials, smooth textures, alter reflections, increase saturation, create artificial depth of field, or make the property look newly rendered. The video must look like the original real photograph gently coming to life.";

    const negativeRule =
      "NEVER DO: room extension, doorway traversal, corner reveal, behind-object reveal, new furniture, new architecture, invented windows, invented doors, invented landscape, invented neighboring structures, generated unseen wall/floor/ceiling surfaces, camera orbit, large dolly, wide-angle expansion, zoom-out, Ken Burns pan, cinematic relighting, or any movement that requires hallucinating new content.";

    /*
     * Put non-negotiable constraints first because Runway prompt length
     * is limited. Property/story context is appended only after them.
     */
    const promptText =
      [
        sourceBoundaryRule,
        occlusionRule,
        kitchenRule,
        cameraRule,
        compositionRule,
        identityRule,
        lightingRule,
        temporalRule,
        realismRule,
        negativeRule,
        baseScenePrompt.slice(0, 120),
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 995);

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
        label: "Hard-Boundary Walkthrough 5s",
        durationSeconds: 5,
        cameraBehavior: "stabilized_forward_translation",
        motionBehavior:
          "hard_boundary_walkthrough_parallax",
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