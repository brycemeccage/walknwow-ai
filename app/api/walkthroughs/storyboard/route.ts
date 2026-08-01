import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type Priority = "hero" | "core" | "supporting" | "optional";
type RiskLevel = "low" | "medium" | "high";

type StoryboardRequest = {
  propertySummary?: unknown;
  propertyDNA?: unknown;
  photos?: unknown;
  mode?: unknown;
};

type PhotoCatalogItem = {
  photoNumber: number;
  category: string;
  roomLabel: string;
  qualityScore: number;
  storytellingScore: number;
  animationSuitabilityScore: number;
  distortionRisk: RiskLevel;
  blurRisk: RiskLevel;
  duplicateOf: number;
  visibleFeatures: string[];
  includeRecommendation: boolean;
  reason: string;
};

type StoryboardScene = {
  sceneNumber: number;
  photoNumber: number;
  priority: Priority;
  title: string;
  purpose: string;
  cameraMove: string;
  movementAmount: "micro" | "subtle" | "moderate";
  transitionIntent: string;
  preservationRules: string[];
  estimatedDurationSeconds: number;
};

type StoryboardOutput = {
  version: "walknwow-storyboard-v1";
  mode: "fast" | "balanced" | "luxury";
  selectedPhotoNumbers: number[];
  storyboard: StoryboardScene[];
  skippedPhotos: Array<{
    photoNumber: number;
    reason: string;
  }>;
  estimatedRuntimeSeconds: number;
  coverageScore: number;
  storytellingScore: number;
  pacingScore: number;
  notes: string[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const STORYBOARD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "mode",
    "selectedPhotoNumbers",
    "storyboard",
    "skippedPhotos",
    "estimatedRuntimeSeconds",
    "coverageScore",
    "storytellingScore",
    "pacingScore",
    "notes",
  ],
  properties: {
    version: {
      type: "string",
      enum: ["walknwow-storyboard-v1"],
    },
    mode: {
      type: "string",
      enum: ["fast", "balanced", "luxury"],
    },
    selectedPhotoNumbers: {
      type: "array",
      items: {
        type: "integer",
        minimum: 1,
      },
    },
    storyboard: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sceneNumber",
          "photoNumber",
          "priority",
          "title",
          "purpose",
          "cameraMove",
          "movementAmount",
          "transitionIntent",
          "preservationRules",
          "estimatedDurationSeconds",
        ],
        properties: {
          sceneNumber: {
            type: "integer",
            minimum: 1,
          },
          photoNumber: {
            type: "integer",
            minimum: 1,
          },
          priority: {
            type: "string",
            enum: [
              "hero",
              "core",
              "supporting",
              "optional",
            ],
          },
          title: { type: "string" },
          purpose: { type: "string" },
          cameraMove: { type: "string" },
          movementAmount: {
            type: "string",
            enum: ["micro", "subtle", "moderate"],
          },
          transitionIntent: { type: "string" },
          preservationRules: {
            type: "array",
            items: { type: "string" },
          },
          estimatedDurationSeconds: {
            type: "number",
            minimum: 2.5,
            maximum: 5,
          },
        },
      },
    },
    skippedPhotos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["photoNumber", "reason"],
        properties: {
          photoNumber: {
            type: "integer",
            minimum: 1,
          },
          reason: { type: "string" },
        },
      },
    },
    estimatedRuntimeSeconds: {
      type: "integer",
      minimum: 0,
    },
    coverageScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    storytellingScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    pacingScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    notes: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

function extractOutputText(
  response: OpenAIResponse
): string {
  if (
    typeof response.output_text === "string" &&
    response.output_text.trim()
  ) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        content.type === "output_text" &&
        typeof content.text === "string" &&
        content.text.trim()
      ) {
        return content.text;
      }
    }
  }

  return "";
}

function normalizeMode(
  value: unknown
): "fast" | "balanced" | "luxury" {
  return value === "fast" ||
    value === "luxury"
    ? value
    : "balanced";
}

function normalizePhotos(
  value: unknown
): PhotoCatalogItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is PhotoCatalogItem =>
        typeof item === "object" &&
        item !== null &&
        Number.isInteger(
          (item as PhotoCatalogItem).photoNumber
        )
    )
    .map((item) => ({
      photoNumber: item.photoNumber,
      category:
        typeof item.category === "string"
          ? item.category
          : "other",
      roomLabel:
        typeof item.roomLabel === "string"
          ? item.roomLabel
          : `Photo ${item.photoNumber}`,
      qualityScore:
        typeof item.qualityScore === "number"
          ? item.qualityScore
          : 50,
      storytellingScore:
        typeof item.storytellingScore === "number"
          ? item.storytellingScore
          : 50,
      animationSuitabilityScore:
        typeof item.animationSuitabilityScore ===
        "number"
          ? item.animationSuitabilityScore
          : 50,
      distortionRisk:
        item.distortionRisk === "low" ||
        item.distortionRisk === "medium" ||
        item.distortionRisk === "high"
          ? (item.distortionRisk as RiskLevel)
          : "medium",
      blurRisk:
        item.blurRisk === "low" ||
        item.blurRisk === "medium" ||
        item.blurRisk === "high"
          ? (item.blurRisk as RiskLevel)
          : "medium",
      duplicateOf:
        Number.isInteger(item.duplicateOf) &&
        item.duplicateOf > 0
          ? item.duplicateOf
          : 0,
      visibleFeatures:
        Array.isArray(item.visibleFeatures)
          ? item.visibleFeatures.filter(
              (feature): feature is string =>
                typeof feature === "string"
            )
          : [],
      includeRecommendation:
        item.includeRecommendation !== false,
      reason:
        typeof item.reason === "string"
          ? item.reason
          : "Evaluated by the vision stage.",
    }))
    .sort(
      (a, b) =>
        a.photoNumber - b.photoNumber
    );
}

function fallbackStoryboard(
  photos: PhotoCatalogItem[],
  mode: "fast" | "balanced" | "luxury"
): StoryboardOutput {
  const usable = photos.filter(
    (photo) =>
      photo.duplicateOf === 0 &&
      photo.qualityScore >= 25 &&
      photo.includeRecommendation
  );

  const selected =
    mode === "fast"
      ? usable.filter(
          (photo) =>
            photo.storytellingScore >= 65 ||
            [
              "front_exterior",
              "entry",
              "foyer",
              "living_room",
              "family_room",
              "kitchen",
              "primary_bedroom",
              "primary_bathroom",
              "backyard",
              "pool",
              "view",
            ].includes(photo.category)
        )
      : usable;

  const finalSelection =
    selected.length > 0 ? selected : usable;

  const storyboard =
    finalSelection.map(
      (photo, index): StoryboardScene => ({
        sceneNumber: index + 1,
        photoNumber: photo.photoNumber,
        priority:
          photo.storytellingScore >= 85
            ? "hero"
            : photo.storytellingScore >= 70
              ? "core"
              : "supporting",
        title: photo.roomLabel,
        purpose:
          "Show this buyer-relevant property space.",
        cameraMove:
          photo.distortionRisk === "high"
            ? "Use an almost-static stabilized micro-push."
            : "Use a slow stabilized forward gimbal glide.",
        movementAmount:
          photo.distortionRisk === "high"
            ? "micro"
            : "subtle",
        transitionIntent:
          "End naturally for a clean cut to the next scene.",
        preservationRules: [
          "Preserve every visible architectural line exactly.",
          "Do not add, remove, replace, or move any object, fixture, furnishing, or landscape element.",
        ],
        estimatedDurationSeconds:
          photo.distortionRisk === "high"
            ? 3
            : mode === "fast"
              ? 3
              : 3.5,
      })
    );

  const selectedSet =
    new Set(
      storyboard.map(
        (scene) => scene.photoNumber
      )
    );

  return {
    version: "walknwow-storyboard-v1",
    mode,
    selectedPhotoNumbers:
      storyboard.map(
        (scene) => scene.photoNumber
      ),
    storyboard,
    skippedPhotos:
      photos
        .filter(
          (photo) =>
            !selectedSet.has(
              photo.photoNumber
            )
        )
        .map((photo) => ({
          photoNumber:
            photo.photoNumber,
          reason:
            photo.duplicateOf > 0
              ? `Duplicate of Photo ${photo.duplicateOf}.`
              : photo.reason,
        })),
    estimatedRuntimeSeconds:
      Math.round(
        storyboard.reduce(
          (total, scene) =>
            total +
            scene.estimatedDurationSeconds,
          0
        )
      ),
    coverageScore:
      mode === "fast" ? 85 : 92,
    storytellingScore: 75,
    pacingScore:
      mode === "fast" ? 90 : 82,
    notes: [
      "Deterministic storyboard fallback used.",
    ],
  };
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as StoryboardRequest;

    const photos =
      normalizePhotos(body.photos);

    if (photos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid photo catalog was provided.",
        },
        { status: 400 }
      );
    }

    const mode =
      normalizeMode(body.mode);

    const apiKey =
      process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        storyboard:
          fallbackStoryboard(
            photos,
            mode
          ),
        usedFallback: true,
      });
    }

    const model =
      process.env
        .OPENAI_STORYBOARD_MODEL
        ?.trim() ||
      "gpt-4.1-mini";

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model,
            input: [
              {
                role: "system",
                content: [
                  {
                    type: "input_text",
                    text: `
You are the WalkNWow Storyboard Engine.

You receive:
- a property summary
- Property DNA
- a catalog describing every listing photo
- a production mode: fast, balanced, or luxury

Your job is to create the final ordered shot list.

SELECTION RULES

Keep:
- strongest exterior or aerial opener
- entry or foyer when available
- all important living spaces
- kitchen
- dining when useful
- primary bedroom and bathroom
- secondary bedrooms and bathrooms that add unique information
- office, basement, gym, theater, game room, garage, guest house, or other amenities
- patio, backyard, pool, dock, views, or outdoor living
- a strong closing exterior or view

Skip:
- true duplicates
- materially weaker redundant angles
- blurry or unusable images
- detail shots with no story value
- repeated angles that add no layout or feature information

MODE RULES

FAST:
- hero and core scenes only
- target efficient pacing
- remove supporting scenes unless they add essential coverage
- ordinary scenes 2.5 to 3.5 seconds
- optimize toward a ten-minute production target

BALANCED:
- hero, core, and valuable supporting scenes
- ordinary scenes 3 to 4 seconds

LUXURY:
- include nearly every meaningful unique scene
- longer hero scenes
- ordinary scenes 3.5 to 5 seconds

ORDER RULES

Use a professional flow:
1. hero exterior or aerial
2. approach, entry, or foyer
3. connected living areas
4. kitchen and dining
5. office or flex space
6. primary suite
7. secondary bedrooms and bathrooms
8. basement, gym, theater, game room, garage, or guest house
9. patio, backyard, pool, dock, views, or other outdoor spaces
10. strongest closing exterior or view

Do not jump randomly between indoors and outdoors.
Group related spaces together.

CAMERA RULES

Use:
- slow forward gimbal glide
- subtle doorway reveal
- restrained micro-push
- gentle centered exterior approach

Avoid:
- orbiting
- spinning
- sweeping pan
- dramatic zoom
- impossible flying
- major perspective changes

Use micro movement for:
- bathrooms
- mirrors
- stairs
- railings
- cabinetry
- repetitive geometry

OUTPUT RULES

selectedPhotoNumbers and storyboard must contain the same photos in the same order.
sceneNumber must be sequential starting at 1.
Every skipped photo must include a reason.
Return strict JSON matching the supplied schema.
`,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text:
                      `MODE: ${mode}\n\nPROPERTY SUMMARY:\n${typeof body.propertySummary === "string" ? body.propertySummary : "Not provided"}\n\nPROPERTY DNA:\n${JSON.stringify(body.propertyDNA ?? {})}\n\nPHOTO CATALOG:\n${JSON.stringify(photos)}`,
                  },
                ],
              },
            ],
            text: {
              format: {
                type: "json_schema",
                name:
                  "walknwow_storyboard_v1",
                strict: true,
                schema:
                  STORYBOARD_SCHEMA,
              },
            },
            max_output_tokens: 7000,
          }),
        }
      );

    const data =
      (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        storyboard:
          fallbackStoryboard(
            photos,
            mode
          ),
        usedFallback: true,
        message:
          data.error?.message ??
          "Storyboard AI failed.",
      });
    }

    const outputText =
      extractOutputText(data);

    if (!outputText) {
      return NextResponse.json({
        success: true,
        storyboard:
          fallbackStoryboard(
            photos,
            mode
          ),
        usedFallback: true,
        message:
          "Storyboard AI returned no output.",
      });
    }

    let storyboard:
      StoryboardOutput;

    try {
      storyboard =
        JSON.parse(
          outputText
        ) as StoryboardOutput;
    } catch {
      return NextResponse.json({
        success: true,
        storyboard:
          fallbackStoryboard(
            photos,
            mode
          ),
        usedFallback: true,
        message:
          "Storyboard AI returned invalid JSON.",
      });
    }

    return NextResponse.json({
      success: true,
      storyboard,
      usedFallback: false,
      message:
        `Storyboard selected ${storyboard.selectedPhotoNumbers.length} of ${photos.length} photos.`,
    });
  } catch (error) {
    console.error(
      "WalkNWow storyboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Storyboard generation failed.",
      },
      { status: 500 }
    );
  }
}