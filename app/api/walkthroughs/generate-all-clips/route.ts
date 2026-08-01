import RunwayML from "@runwayml/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type RiskLevel = "low" | "medium" | "high";

type SceneCategory =
  | "aerial"
  | "front_exterior"
  | "rear_exterior"
  | "entry"
  | "foyer"
  | "hallway"
  | "stairs"
  | "living_room"
  | "family_room"
  | "kitchen"
  | "dining_room"
  | "office"
  | "primary_bedroom"
  | "bedroom"
  | "primary_bathroom"
  | "bathroom"
  | "laundry"
  | "basement"
  | "garage"
  | "gym"
  | "theater"
  | "game_room"
  | "wine_cellar"
  | "guest_house"
  | "patio_deck"
  | "backyard"
  | "pool"
  | "outdoor_kitchen"
  | "fire_pit"
  | "dock"
  | "view"
  | "detail"
  | "other";

type PropertyDNA = {
  propertyType?: string;
  architecturalStyle?: string;
  luxuryLevel?: string;
  exterior?: {
    siding?: string;
    roof?: string;
    windows?: string;
    doors?: string;
    garage?: string;
    driveway?: string;
    landscaping?: string;
  };
  interior?: {
    flooring?: string;
    walls?: string;
    ceilings?: string;
    trim?: string;
    lighting?: string;
    colorPalette?: string;
  };
  kitchen?: {
    cabinets?: string;
    countertops?: string;
    backsplash?: string;
    appliances?: string;
    island?: string;
    hardware?: string;
  };
  livingAreas?: {
    fireplace?: string;
    windows?: string;
    ceilingFeatures?: string;
    builtIns?: string;
  };
  bedrooms?: {
    flooring?: string;
    walls?: string;
    windows?: string;
  };
  bathrooms?: {
    vanities?: string;
    tile?: string;
    mirrors?: string;
    fixtures?: string;
    glass?: string;
  };
  outdoor?: {
    patio?: string;
    pool?: string;
    fencing?: string;
    views?: string;
    amenities?: string[];
  };
  standoutFeatures?: string[];
  continuityRules?: string[];
};

type DirectorScene = {
  sceneNumber?: number;
  photoNumber?: number;
  category?: SceneCategory;
  roomLabel?: string;
  storyRole?: string;
  distortionRisk?: RiskLevel;
  blurRisk?: RiskLevel;
  visibleFeatures?: string[];
  cameraMove?: string;
  movementAmount?: "micro" | "subtle" | "moderate";
  transitionIntent?: string;
  preservationRules?: string[];
  estimatedDurationSeconds?: number;
};

type GenerateClipRequest = {
  imageUrl?: string;
  category?: SceneCategory | string;
  distortionRisk?: RiskLevel;
  blurRisk?: RiskLevel;
  scene?: DirectorScene;
  propertyDNA?: PropertyDNA;
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function stringList(value: unknown, max = 15): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim())
    .slice(0, max);
}

function risk(value: unknown, fallback: RiskLevel): RiskLevel {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : fallback;
}

function category(value: unknown): SceneCategory {
  const supported: SceneCategory[] = [
    "aerial",
    "front_exterior",
    "rear_exterior",
    "entry",
    "foyer",
    "hallway",
    "stairs",
    "living_room",
    "family_room",
    "kitchen",
    "dining_room",
    "office",
    "primary_bedroom",
    "bedroom",
    "primary_bathroom",
    "bathroom",
    "laundry",
    "basement",
    "garage",
    "gym",
    "theater",
    "game_room",
    "wine_cellar",
    "guest_house",
    "patio_deck",
    "backyard",
    "pool",
    "outdoor_kitchen",
    "fire_pit",
    "dock",
    "view",
    "detail",
    "other",
  ];

  return typeof value === "string" &&
    supported.includes(value as SceneCategory)
    ? (value as SceneCategory)
    : "other";
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function known(value: unknown): string {
  const result = text(value);

  if (
    !result ||
    result.toLowerCase() === "not clearly visible" ||
    result.toLowerCase() === "not analyzed"
  ) {
    return "";
  }

  return result;
}

function joinFacts(label: string, facts: Array<[string, unknown]>): string {
  const usable = facts
    .map(([name, value]) => {
      const cleaned = known(value);
      return cleaned ? `${name}: ${cleaned}` : "";
    })
    .filter(Boolean);

  return usable.length > 0 ? `${label}: ${usable.join("; ")}.` : "";
}

function buildPropertyIdentity(
  sceneCategory: SceneCategory,
  dna: PropertyDNA
): string {
  const general = joinFacts("Property identity", [
    ["type", dna.propertyType],
    ["architectural style", dna.architecturalStyle],
    ["luxury level", dna.luxuryLevel],
  ]);

  if (
    [
      "aerial",
      "front_exterior",
      "rear_exterior",
      "entry",
      "garage",
    ].includes(sceneCategory)
  ) {
    return compact(
      [
        general,
        joinFacts("Exterior identity", [
          ["siding", dna.exterior?.siding],
          ["roof", dna.exterior?.roof],
          ["windows", dna.exterior?.windows],
          ["doors", dna.exterior?.doors],
          ["garage", dna.exterior?.garage],
          ["driveway", dna.exterior?.driveway],
          ["landscaping", dna.exterior?.landscaping],
        ]),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (sceneCategory === "kitchen") {
    return compact(
      [
        general,
        joinFacts("Kitchen identity", [
          ["cabinets", dna.kitchen?.cabinets],
          ["countertops", dna.kitchen?.countertops],
          ["backsplash", dna.kitchen?.backsplash],
          ["appliances", dna.kitchen?.appliances],
          ["island", dna.kitchen?.island],
          ["hardware", dna.kitchen?.hardware],
        ]),
        joinFacts("Shared interior identity", [
          ["flooring", dna.interior?.flooring],
          ["walls", dna.interior?.walls],
          ["ceilings", dna.interior?.ceilings],
          ["lighting", dna.interior?.lighting],
        ]),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (
    sceneCategory === "primary_bedroom" ||
    sceneCategory === "bedroom" ||
    sceneCategory === "guest_house"
  ) {
    return compact(
      [
        general,
        joinFacts("Bedroom identity", [
          ["flooring", dna.bedrooms?.flooring],
          ["walls", dna.bedrooms?.walls],
          ["windows", dna.bedrooms?.windows],
        ]),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (
    sceneCategory === "primary_bathroom" ||
    sceneCategory === "bathroom"
  ) {
    return compact(
      [
        general,
        joinFacts("Bathroom identity", [
          ["vanities", dna.bathrooms?.vanities],
          ["tile", dna.bathrooms?.tile],
          ["mirrors", dna.bathrooms?.mirrors],
          ["fixtures", dna.bathrooms?.fixtures],
          ["glass", dna.bathrooms?.glass],
        ]),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  if (
    [
      "patio_deck",
      "backyard",
      "pool",
      "outdoor_kitchen",
      "fire_pit",
      "dock",
      "view",
    ].includes(sceneCategory)
  ) {
    const amenities = stringList(dna.outdoor?.amenities).join(", ");

    return compact(
      [
        general,
        joinFacts("Outdoor identity", [
          ["patio", dna.outdoor?.patio],
          ["pool", dna.outdoor?.pool],
          ["fencing", dna.outdoor?.fencing],
          ["views", dna.outdoor?.views],
          ["landscaping", dna.exterior?.landscaping],
          ["amenities", amenities],
        ]),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  return compact(
    [
      general,
      joinFacts("Interior identity", [
        ["flooring", dna.interior?.flooring],
        ["walls", dna.interior?.walls],
        ["ceilings", dna.interior?.ceilings],
        ["trim", dna.interior?.trim],
        ["lighting", dna.interior?.lighting],
        ["color palette", dna.interior?.colorPalette],
        ["fireplace", dna.livingAreas?.fireplace],
        ["windows", dna.livingAreas?.windows],
        ["ceiling features", dna.livingAreas?.ceilingFeatures],
        ["built-ins", dna.livingAreas?.builtIns],
      ]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function defaultCameraMove(
  sceneCategory: SceneCategory,
  distortionRisk: RiskLevel
): string {
  if (distortionRisk === "high") {
    return "Use an almost-static stabilized shot with only a tiny forward micro-glide.";
  }

  switch (sceneCategory) {
    case "aerial":
      return "Use a very slow straight aerial glide with no rotation and no altitude change.";

    case "front_exterior":
    case "rear_exterior":
      return "Use a slow, centered gimbal-style approach toward the home with minimal perspective change.";

    case "entry":
    case "foyer":
    case "hallway":
      return "Use a slow straight doorway-entry glide, remaining centered and level.";

    case "stairs":
      return "Use an almost-static micro-glide that preserves every stair and railing line.";

    case "living_room":
    case "family_room":
    case "dining_room":
    case "office":
      return "Use a slow stabilized forward glide that gently reveals the space without orbiting.";

    case "kitchen":
      return "Use a slow centered glide toward the island or main cabinetry, keeping all straight lines stable.";

    case "primary_bedroom":
    case "bedroom":
    case "guest_house":
      return "Use a subtle doorway-style glide toward the room’s focal point with minimal motion.";

    case "primary_bathroom":
    case "bathroom":
      return "Use an extremely subtle forward micro-glide with no reflection or geometry changes.";

    case "patio_deck":
    case "backyard":
    case "pool":
    case "outdoor_kitchen":
    case "fire_pit":
    case "dock":
    case "view":
      return "Use a slow stable forward outdoor glide with a level horizon and no sweeping pan.";

    case "detail":
      return "Use an almost perfectly still cinematic micro-push.";

    default:
      return "Use a slow stabilized forward gimbal glide with minimal movement.";
  }
}

function buildPrompt(
  scene: DirectorScene,
  dna: PropertyDNA,
  sceneCategory: SceneCategory,
  distortionRisk: RiskLevel,
  blurRisk: RiskLevel
): string {
  const preservationRules = stringList(
    scene.preservationRules,
    15
  );

  const visibleFeatures = stringList(
    scene.visibleFeatures,
    15
  );

  const continuityRules = stringList(
    dna.continuityRules,
    20
  );

  const identity = buildPropertyIdentity(sceneCategory, dna);

  const movement = text(
    scene.cameraMove,
    defaultCameraMove(sceneCategory, distortionRisk)
  );

  const strictness =
    distortionRisk === "high"
      ? "Use extremely little motion. Keep every straight line locked and stable."
      : distortionRisk === "medium"
        ? "Use restrained motion and prioritize geometry stability."
        : "Use gentle realistic motion while preserving the image exactly.";

  const blurInstruction =
    blurRisk === "high"
      ? "The first frame must begin fully sharp and resolved. Do not begin out of focus, soft, smeared, or motion-blurred."
      : "Begin immediately with a sharp, fully resolved frame.";

  return compact(`
Create a photorealistic professional real-estate walkthrough clip from this exact source image.

SCENE
Room: ${text(scene.roomLabel, sceneCategory.replaceAll("_", " "))}
Role: ${text(scene.storyRole, "property walkthrough scene")}
Visible features: ${visibleFeatures.join(", ") || "preserve every visible feature exactly"}.

CAMERA
${movement}
The camera must feel like a real professional videographer using a stabilized gimbal.
No orbiting. No spinning. No dramatic zoom. No sweeping side-to-side pan. No impossible flying. No camera roll. No sudden acceleration. Do not reveal unseen areas.

SHARPNESS
${blurInstruction}
Keep the image sharp throughout the clip. No focus hunting, settling blur, smeared edges, or soft opening frames.

ARCHITECTURAL PRESERVATION
Preserve the exact source image.
Do not add, remove, replace, redesign, stretch, bend, warp, rotate, repaint, relight, or invent anything.
Preserve all architecture, proportions, perspective, room dimensions, wall positions, ceiling height, siding, rooflines, windows, doors, trim, railings, stairs, cabinetry, countertops, appliances, fixtures, flooring, mirrors, glass, furniture, decor, landscaping, pools, fences, horizons, and views.
Furniture and fixtures must remain completely stationary.
Accuracy is more important than motion.
${strictness}

PROPERTY CONTINUITY
${identity || "Use only the visual identity shown in the source image."}
${continuityRules.join(". ")}

SCENE-SPECIFIC RULES
${preservationRules.join(". ") || "Preserve every visible object, material, edge, color, and architectural line exactly."}

TRANSITION INTENT
${text(scene.transitionIntent, "End naturally so the editor can cut cleanly to the next scene.")}

Final result: lifelike, restrained, stable, sharp, cinematic real-estate footage that looks filmed at the actual property, not AI-generated.
`);
}

async function resolvePromptImage(imageUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (!imageUrl.startsWith("/")) {
    throw new Error("The image path is invalid.");
  }

  const relativePath = imageUrl.replace(/^\/+/, "");
  const filePath = path.join(
    process.cwd(),
    "public",
    relativePath
  );

  const buffer = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();

  const mime =
    extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg";

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as GenerateClipRequest;

    const imageUrl = text(body.imageUrl);

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "An image URL is required.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.RUNWAYML_API_SECRET?.trim();

    if (!apiKey || !apiKey.startsWith("key_")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "RUNWAYML_API_SECRET is missing or invalid.",
        },
        { status: 500 }
      );
    }

    const suppliedScene =
      body.scene &&
      typeof body.scene === "object"
        ? body.scene
        : {};

    const sceneCategory = category(
      suppliedScene.category ?? body.category
    );

    const distortionRisk = risk(
      suppliedScene.distortionRisk ??
        body.distortionRisk,
      "medium"
    );

    const blurRisk = risk(
      suppliedScene.blurRisk ?? body.blurRisk,
      "medium"
    );

    const scene: DirectorScene = {
      ...suppliedScene,
      category: sceneCategory,
      distortionRisk,
      blurRisk,
    };

    const dna =
      body.propertyDNA &&
      typeof body.propertyDNA === "object"
        ? body.propertyDNA
        : {};

    const promptImage =
      await resolvePromptImage(imageUrl);

    const promptText = buildPrompt(
      scene,
      dna,
      sceneCategory,
      distortionRisk,
      blurRisk
    );

    const runway = new RunwayML({
      apiKey,
    });

    const task = await runway.imageToVideo
      .create({
        model: "gen4.5",
        promptImage,
        promptText,
        ratio: "1280:720",
        duration: 5,
      })
      .waitForTaskOutput();

    const videoUrl = task.output?.[0];

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
      category: sceneCategory,
      distortionRisk,
      blurRisk,
      promptText,
    });
  } catch (error) {
    console.error(
      "WalkNWow V2 generate-clip error:",
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