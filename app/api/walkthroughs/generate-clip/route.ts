import RunwayML, { TaskFailedError } from "@runwayml/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type DistortionRisk = "low" | "medium" | "high";

type PropertyMemory = {
  exterior?: string;
  frontDoor?: string;
  roof?: string;
  windows?: string;
  kitchen?: string;
  flooring?: string;
  fireplace?: string;
  landscaping?: string;
  standoutFeatures?: string[];
};

type GenerateClipRequest = {
  imageUrl?: string;
  photoNumber?: number;
  category?: string;
  distortionRisk?: DistortionRisk;
  blurRisk?: DistortionRisk;
  storyRole?: string;
  cameraMove?: string;
  transitionIntent?: string;
  preservationRules?: string[];
  visibleFeatures?: string[];
  propertySummary?: string;
  propertyMemory?: PropertyMemory;
};

type PromptContext = {
  category: string;
  distortionRisk: DistortionRisk;
  blurRisk: DistortionRisk;
  cameraMove: string;
  transitionIntent: string;
  storyRole: string;
  preservationRules: string[];
  visibleFeatures: string[];
  propertySummary: string;
  propertyMemory: PropertyMemory;
};

const PROMPT_VERSION = "walknwow-property-dna-v1";
const MAX_PROMPT_LENGTH = 950;

const KNOWN_CATEGORIES = new Set([
  "front_exterior",
  "rear_exterior",
  "aerial",
  "entry",
  "foyer",
  "hallway",
  "living_room",
  "family_room",
  "kitchen",
  "dining_room",
  "primary_bedroom",
  "bedroom",
  "primary_bathroom",
  "bathroom",
  "office",
  "stairs",
  "patio_deck",
  "backyard",
  "pool",
  "view",
  "garage",
  "basement",
  "laundry",
  "detail_closeup",
  "other",
]);

function cleanText(value: unknown, maxLength = 180): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanList(value: unknown, maxItems = 6): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanText(item, 90))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeRisk(value: unknown): DistortionRisk {
  if (value === "high" || value === "medium") {
    return value;
  }

  return "low";
}

function normalizeCategory(value: unknown): string {
  const category = cleanText(value, 40).toLowerCase();
  return KNOWN_CATEGORIES.has(category) ? category : "other";
}

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getDefaultCameraMove(
  category: string,
  distortionRisk: DistortionRisk
): string {
  if (distortionRisk === "high") {
    return "almost-static shot with a tiny slow forward micro-push and no perspective change";
  }

  switch (category) {
    case "front_exterior":
    case "rear_exterior":
      return "very slow stabilized forward approach toward the home";

    case "aerial":
      return "slow level forward aerial glide with no rotation or altitude change";

    case "entry":
    case "foyer":
    case "hallway":
      return "subtle centered doorway-to-room forward glide";

    case "living_room":
    case "family_room":
      return "gentle centered forward dolly with minimal natural parallax";

    case "kitchen":
      return "slow centered glide toward the island or main counter";

    case "dining_room":
      return "subtle forward glide toward the dining area";

    case "primary_bedroom":
    case "bedroom":
      return "very slow doorway-style push toward the bed";

    case "primary_bathroom":
    case "bathroom":
      return "almost-static forward micro-push with no reflection change";

    case "stairs":
      return "almost-static micro-push with every railing and stair line fixed";

    case "patio_deck":
    case "backyard":
    case "pool":
    case "view":
      return "slow stable forward outdoor glide with a fixed horizon";

    case "office":
    case "garage":
    case "basement":
    case "laundry":
      return "simple slow centered forward push";

    case "detail_closeup":
      return "nearly locked camera with only a tiny forward micro-push";

    default:
      return "slow stabilized forward glide with minimal movement";
  }
}

function getCategoryProtection(category: string): string {
  switch (category) {
    case "front_exterior":
    case "rear_exterior":
    case "aerial":
      return "Lock siding, roofline, windows, doors, driveway, landscaping, horizon and building footprint.";

    case "kitchen":
      return "Lock cabinet layout, counters, island edges, appliances, backsplash, fixtures and floor lines.";

    case "living_room":
    case "family_room":
      return "Lock walls, ceiling, windows, fireplace, furniture placement, decor and floor geometry.";

    case "primary_bedroom":
    case "bedroom":
      return "Lock bed, furniture, windows, curtains, walls, ceiling and floor geometry.";

    case "primary_bathroom":
    case "bathroom":
      return "Lock mirrors, reflections, glass, tile lines, vanity, fixtures, doors and walls.";

    case "stairs":
      return "Lock every stair, railing, spindle, landing, wall edge and repeating line.";

    case "patio_deck":
    case "backyard":
    case "pool":
    case "view":
      return "Lock pool and patio shapes, fences, landscaping, structures, horizon and view.";

    case "entry":
    case "foyer":
    case "hallway":
      return "Lock door frames, trim, walls, railings, floor lines and visible room boundaries.";

    default:
      return "Lock every visible object, architectural edge, material and spatial proportion.";
  }
}

function memoryPairs(
  category: string,
  memory: PropertyMemory
): Array<[string, string]> {
  const allPairs: Array<[string, string]> = [
    ["exterior", cleanText(memory.exterior, 100)],
    ["front door", cleanText(memory.frontDoor, 80)],
    ["roof", cleanText(memory.roof, 80)],
    ["windows", cleanText(memory.windows, 80)],
    ["kitchen", cleanText(memory.kitchen, 100)],
    ["flooring", cleanText(memory.flooring, 80)],
    ["fireplace", cleanText(memory.fireplace, 80)],
    ["landscaping", cleanText(memory.landscaping, 80)],
  ];

  const wanted = new Set<string>();

  if (
    [
      "front_exterior",
      "rear_exterior",
      "aerial",
      "entry",
      "patio_deck",
      "backyard",
      "pool",
      "view",
    ].includes(category)
  ) {
    wanted.add("exterior");
    wanted.add("front door");
    wanted.add("roof");
    wanted.add("windows");
    wanted.add("landscaping");
  }

  if (category === "kitchen" || category === "dining_room") {
    wanted.add("kitchen");
    wanted.add("flooring");
    wanted.add("windows");
  }

  if (
    [
      "living_room",
      "family_room",
      "primary_bedroom",
      "bedroom",
      "office",
      "foyer",
      "hallway",
      "stairs",
    ].includes(category)
  ) {
    wanted.add("flooring");
    wanted.add("windows");
    wanted.add("fireplace");
  }

  if (category === "primary_bathroom" || category === "bathroom") {
    wanted.add("flooring");
    wanted.add("windows");
  }

  return allPairs.filter(
    ([label, value]) => value && wanted.has(label)
  );
}

function appendWithinLimit(
  current: string,
  clause: string,
  maxLength = MAX_PROMPT_LENGTH
): string {
  const cleanClause = cleanText(clause, 260);

  if (!cleanClause) {
    return current;
  }

  const candidate = current
    ? `${current} ${cleanClause}`
    : cleanClause;

  if (candidate.length <= maxLength) {
    return candidate;
  }

  const remaining = maxLength - current.length - 1;

  if (remaining < 25) {
    return current;
  }

  return `${current} ${cleanClause.slice(0, remaining).trim()}`;
}

function buildPrompt(context: PromptContext): {
  promptText: string;
  motionUsed: string;
} {
  const directorMove = cleanText(context.cameraMove, 170);
  const safeDefaultMove = getDefaultCameraMove(
    context.category,
    context.distortionRisk
  );

  const motionUsed =
    context.distortionRisk === "high"
      ? safeDefaultMove
      : directorMove || safeDefaultMove;

  let prompt =
    "Photorealistic real-estate video from this exact source image. Treat the image as immutable ground truth. Preserve all visible architecture, geometry, proportions, materials, colors, lighting, landscaping, furniture, fixtures and object positions. Do not add, remove, replace, reshape, move or reveal anything outside the original frame.";

  prompt = appendWithinLimit(
    prompt,
    `Camera: ${motionUsed}. Move like a slow professional stabilized gimbal. No orbit, spin, roll, tilt, sweeping pan, dramatic zoom, impossible flight or large perspective change.`
  );

  prompt = appendWithinLimit(
    prompt,
    getCategoryProtection(context.category)
  );

  const dna = memoryPairs(
    context.category,
    context.propertyMemory
  )
    .map(([label, value]) => `${label}: ${value}`)
    .join("; ");

  if (dna) {
    prompt = appendWithinLimit(
      prompt,
      `Property DNA continuity: ${dna}. Keep these details identical.`
    );
  }

  if (context.visibleFeatures.length > 0) {
    prompt = appendWithinLimit(
      prompt,
      `Visible features to preserve: ${context.visibleFeatures.join(", ")}.`
    );
  }

  if (context.preservationRules.length > 0) {
    prompt = appendWithinLimit(
      prompt,
      `Director preservation rules: ${context.preservationRules.join("; ")}.`
    );
  }

  if (context.storyRole) {
    prompt = appendWithinLimit(
      prompt,
      `Scene purpose: ${context.storyRole}.`
    );
  }

  if (context.transitionIntent) {
    prompt = appendWithinLimit(
      prompt,
      `End with a steady natural settle suitable for: ${context.transitionIntent}. Do not invent a connection.`
    );
  }

  if (context.blurRisk !== "low") {
    prompt = appendWithinLimit(
      prompt,
      "Keep the first frame immediately sharp and stable; no soft-focus startup, focus hunting or smeared motion."
    );
  }

  prompt = appendWithinLimit(
    prompt,
    "Accuracy and continuity are more important than motion."
  );

  return {
    promptText: prompt.slice(0, MAX_PROMPT_LENGTH),
    motionUsed,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateClipRequest;
    const imageUrl = cleanText(body.imageUrl, 2000);

    if (!imageUrl || !isValidImageUrl(imageUrl)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid HTTP or HTTPS image URL is required.",
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

    const category = normalizeCategory(body.category);
    const distortionRisk = normalizeRisk(body.distortionRisk);
    const blurRisk = normalizeRisk(body.blurRisk);

    const propertyMemory: PropertyMemory = {
      exterior: cleanText(body.propertyMemory?.exterior, 120),
      frontDoor: cleanText(body.propertyMemory?.frontDoor, 100),
      roof: cleanText(body.propertyMemory?.roof, 100),
      windows: cleanText(body.propertyMemory?.windows, 100),
      kitchen: cleanText(body.propertyMemory?.kitchen, 120),
      flooring: cleanText(body.propertyMemory?.flooring, 100),
      fireplace: cleanText(body.propertyMemory?.fireplace, 100),
      landscaping: cleanText(body.propertyMemory?.landscaping, 100),
      standoutFeatures: cleanList(
        body.propertyMemory?.standoutFeatures,
        6
      ),
    };

    const context: PromptContext = {
      category,
      distortionRisk,
      blurRisk,
      cameraMove: cleanText(body.cameraMove, 180),
      transitionIntent: cleanText(body.transitionIntent, 140),
      storyRole: cleanText(body.storyRole, 120),
      preservationRules: cleanList(body.preservationRules, 6),
      visibleFeatures: cleanList(body.visibleFeatures, 8),
      propertySummary: cleanText(body.propertySummary, 180),
      propertyMemory,
    };

    const { promptText, motionUsed } = buildPrompt(context);

    const runway = new RunwayML({
      apiKey,
    });

    const task = await runway.imageToVideo
      .create({
        model: "gen4.5",
        promptImage: imageUrl,
        promptText,
        ratio: "1280:720",
        duration: 5,
      })
      .waitForTaskOutput({
        timeout: 4 * 60 * 1000,
        abortSignal: request.signal,
      });

    const videoUrl = task.output?.[0];

    if (!videoUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Runway finished but did not return a video URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      videoUrl,
      photoNumber:
        Number.isInteger(body.photoNumber) &&
        Number(body.photoNumber) > 0
          ? Number(body.photoNumber)
          : undefined,
      category,
      distortionRisk,
      blurRisk,
      motionUsed,
      promptVersion: PROMPT_VERSION,
      promptLength: promptText.length,
    });
  } catch (error) {
    if (error instanceof TaskFailedError) {
      console.error(
        "Runway task failed:",
        error.taskDetails
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Runway could not generate this property clip.",
          taskDetails: error.taskDetails,
        },
        { status: 500 }
      );
    }

    console.error("Runway generate-clip error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The property clip could not be generated.",
      },
      { status: 500 }
    );
  }
}