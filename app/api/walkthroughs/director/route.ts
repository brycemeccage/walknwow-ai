import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type RiskLevel = "low" | "medium" | "high";
type Importance =
  | "critical"
  | "important"
  | "supporting"
  | "optional";

type DirectorRequest = {
  images?: unknown;
  listingUrl?: unknown;
};

type PhotoAnalysis = {
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

type PropertyDNA = {
  propertyType: string;
  architecturalStyle: string;
  luxuryLevel: string;
  exterior: {
    siding: string;
    roof: string;
    windows: string;
    doors: string;
    garage: string;
    driveway: string;
    landscaping: string;
  };
  interior: {
    flooring: string;
    walls: string;
    ceilings: string;
    trim: string;
    lighting: string;
    colorPalette: string;
  };
  kitchen: {
    cabinets: string;
    countertops: string;
    backsplash: string;
    appliances: string;
    island: string;
    hardware: string;
  };
  livingAreas: {
    fireplace: string;
    windows: string;
    ceilingFeatures: string;
    builtIns: string;
  };
  bedrooms: {
    flooring: string;
    walls: string;
    windows: string;
  };
  bathrooms: {
    vanities: string;
    tile: string;
    mirrors: string;
    fixtures: string;
    glass: string;
  };
  outdoor: {
    patio: string;
    pool: string;
    fencing: string;
    views: string;
    amenities: string[];
  };
  standoutFeatures: string[];
  continuityRules: string[];
};

type StoryScene = {
  photoNumber: number;
  importance: Importance;
  storyRole: string;
  cameraMove: string;
  movementAmount: "micro" | "subtle" | "moderate";
  transitionIntent: string;
  preservationRules: string[];
  estimatedDurationSeconds: number;
};

type DirectorScene = PhotoAnalysis &
  StoryScene & {
    sceneNumber: number;
    include: boolean;
  };

type DirectorOutput = {
  version: "walknwow-director-v3.1";
  propertySummary: string;
  propertyDNA: PropertyDNA;
  scenes: DirectorScene[];
  selectedPhotoNumbers: number[];
  skippedPhotos: Array<{
    photoNumber: number;
    reason: string;
  }>;
  estimatedRuntimeSeconds: number;
  coverageScore: number;
  storytellingScore: number;
  continuityScore: number;
  directorNotes: string[];
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

const PHOTO_BATCH_SIZE = 8;

const PHOTO_BATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["photos"],
  properties: {
    photos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "photoNumber",
          "category",
          "roomLabel",
          "qualityScore",
          "storytellingScore",
          "animationSuitabilityScore",
          "distortionRisk",
          "blurRisk",
          "duplicateOf",
          "visibleFeatures",
          "includeRecommendation",
          "reason",
        ],
        properties: {
          photoNumber: {
            type: "integer",
            minimum: 1,
          },
          category: { type: "string" },
          roomLabel: { type: "string" },
          qualityScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
          },
          storytellingScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
          },
          animationSuitabilityScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
          },
          distortionRisk: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          blurRisk: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          duplicateOf: {
            type: "integer",
            minimum: 0,
          },
          visibleFeatures: {
            type: "array",
            items: { type: "string" },
          },
          includeRecommendation: {
            type: "boolean",
          },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

const DNA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "propertySummary",
    "propertyDNA",
  ],
  properties: {
    propertySummary: {
      type: "string",
    },
    propertyDNA: {
      type: "object",
      additionalProperties: false,
      required: [
        "propertyType",
        "architecturalStyle",
        "luxuryLevel",
        "exterior",
        "interior",
        "kitchen",
        "livingAreas",
        "bedrooms",
        "bathrooms",
        "outdoor",
        "standoutFeatures",
        "continuityRules",
      ],
      properties: {
        propertyType: { type: "string" },
        architecturalStyle: {
          type: "string",
        },
        luxuryLevel: { type: "string" },
        exterior: {
          type: "object",
          additionalProperties: false,
          required: [
            "siding",
            "roof",
            "windows",
            "doors",
            "garage",
            "driveway",
            "landscaping",
          ],
          properties: {
            siding: { type: "string" },
            roof: { type: "string" },
            windows: { type: "string" },
            doors: { type: "string" },
            garage: { type: "string" },
            driveway: { type: "string" },
            landscaping: { type: "string" },
          },
        },
        interior: {
          type: "object",
          additionalProperties: false,
          required: [
            "flooring",
            "walls",
            "ceilings",
            "trim",
            "lighting",
            "colorPalette",
          ],
          properties: {
            flooring: { type: "string" },
            walls: { type: "string" },
            ceilings: { type: "string" },
            trim: { type: "string" },
            lighting: { type: "string" },
            colorPalette: { type: "string" },
          },
        },
        kitchen: {
          type: "object",
          additionalProperties: false,
          required: [
            "cabinets",
            "countertops",
            "backsplash",
            "appliances",
            "island",
            "hardware",
          ],
          properties: {
            cabinets: { type: "string" },
            countertops: { type: "string" },
            backsplash: { type: "string" },
            appliances: { type: "string" },
            island: { type: "string" },
            hardware: { type: "string" },
          },
        },
        livingAreas: {
          type: "object",
          additionalProperties: false,
          required: [
            "fireplace",
            "windows",
            "ceilingFeatures",
            "builtIns",
          ],
          properties: {
            fireplace: { type: "string" },
            windows: { type: "string" },
            ceilingFeatures: {
              type: "string",
            },
            builtIns: { type: "string" },
          },
        },
        bedrooms: {
          type: "object",
          additionalProperties: false,
          required: [
            "flooring",
            "walls",
            "windows",
          ],
          properties: {
            flooring: { type: "string" },
            walls: { type: "string" },
            windows: { type: "string" },
          },
        },
        bathrooms: {
          type: "object",
          additionalProperties: false,
          required: [
            "vanities",
            "tile",
            "mirrors",
            "fixtures",
            "glass",
          ],
          properties: {
            vanities: { type: "string" },
            tile: { type: "string" },
            mirrors: { type: "string" },
            fixtures: { type: "string" },
            glass: { type: "string" },
          },
        },
        outdoor: {
          type: "object",
          additionalProperties: false,
          required: [
            "patio",
            "pool",
            "fencing",
            "views",
            "amenities",
          ],
          properties: {
            patio: { type: "string" },
            pool: { type: "string" },
            fencing: { type: "string" },
            views: { type: "string" },
            amenities: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        standoutFeatures: {
          type: "array",
          items: { type: "string" },
        },
        continuityRules: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
} as const;

const STORY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "selectedPhotoNumbers",
    "scenes",
    "coverageScore",
    "storytellingScore",
    "continuityScore",
    "directorNotes",
  ],
  properties: {
    selectedPhotoNumbers: {
      type: "array",
      items: {
        type: "integer",
        minimum: 1,
      },
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "photoNumber",
          "importance",
          "storyRole",
          "cameraMove",
          "movementAmount",
          "transitionIntent",
          "preservationRules",
          "estimatedDurationSeconds",
        ],
        properties: {
          photoNumber: {
            type: "integer",
            minimum: 1,
          },
          importance: {
            type: "string",
            enum: [
              "critical",
              "important",
              "supporting",
              "optional",
            ],
          },
          storyRole: { type: "string" },
          cameraMove: { type: "string" },
          movementAmount: {
            type: "string",
            enum: [
              "micro",
              "subtle",
              "moderate",
            ],
          },
          transitionIntent: {
            type: "string",
          },
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
    continuityScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    directorNotes: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

function validImages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      /^https?:\/\//i.test(item)
  );
}

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

function clampScore(
  value: unknown,
  fallback = 50
): number {
  const numberValue =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : fallback;

  return Math.max(
    0,
    Math.min(100, Math.round(numberValue))
  );
}

function clampDuration(
  value: unknown
): number {
  const numberValue =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : 3.5;

  return Math.max(
    2.5,
    Math.min(
      5,
      Number(numberValue.toFixed(1))
    )
  );
}

function text(
  value: unknown,
  fallback: string
): string {
  return typeof value === "string" &&
    value.trim()
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

function normalizeRisk(
  value: unknown
): RiskLevel {
  return value === "low" ||
    value === "medium" ||
    value === "high"
    ? value
    : "medium";
}

function normalizeImportance(
  value: unknown
): Importance {
  return value === "critical" ||
    value === "important" ||
    value === "supporting" ||
    value === "optional"
    ? value
    : "supporting";
}

async function callStructured<T>(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userContent: Array<Record<string, unknown>>;
  schemaName: string;
  schema: unknown;
  maxOutputTokens: number;
}): Promise<T> {
  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${args.apiKey}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        model: args.model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: args.systemPrompt,
              },
            ],
          },
          {
            role: "user",
            content:
              args.userContent,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: args.schemaName,
            strict: true,
            schema: args.schema,
          },
        },
        max_output_tokens:
          args.maxOutputTokens,
      }),
    }
  );

  const data =
    (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `OpenAI returned ${response.status}.`
    );
  }

  const outputText =
    extractOutputText(data);

  if (!outputText) {
    throw new Error(
      "OpenAI returned no structured output."
    );
  }

  try {
    return JSON.parse(outputText) as T;
  } catch {
    throw new Error(
      "OpenAI returned invalid JSON."
    );
  }
}

function normalizePhoto(
  raw: PhotoAnalysis,
  expectedPhotoNumber: number,
  imageCount: number
): PhotoAnalysis {
  const duplicateOf =
    Number.isInteger(raw.duplicateOf) &&
    raw.duplicateOf > 0 &&
    raw.duplicateOf <
      expectedPhotoNumber &&
    raw.duplicateOf <= imageCount
      ? raw.duplicateOf
      : 0;

  return {
    photoNumber:
      expectedPhotoNumber,
    category: text(
      raw.category,
      "other"
    ),
    roomLabel: text(
      raw.roomLabel,
      `Photo ${expectedPhotoNumber}`
    ),
    qualityScore: clampScore(
      raw.qualityScore
    ),
    storytellingScore:
      clampScore(
        raw.storytellingScore
      ),
    animationSuitabilityScore:
      clampScore(
        raw.animationSuitabilityScore
      ),
    distortionRisk:
      normalizeRisk(
        raw.distortionRisk
      ),
    blurRisk:
      normalizeRisk(
        raw.blurRisk
      ),
    duplicateOf,
    visibleFeatures:
      stringList(
        raw.visibleFeatures,
        15
      ),
    includeRecommendation:
      raw.includeRecommendation !==
      false,
    reason: text(
      raw.reason,
      "Analyzed by Director V3.1."
    ),
  };
}

async function analyzePhotoBatches(
  apiKey: string,
  model: string,
  images: string[]
): Promise<PhotoAnalysis[]> {
  const batches: Array<{
    start: number;
    images: string[];
  }> = [];

  for (
    let start = 0;
    start < images.length;
    start += PHOTO_BATCH_SIZE
  ) {
    batches.push({
      start,
      images: images.slice(
        start,
        start + PHOTO_BATCH_SIZE
      ),
    });
  }

  const results =
    await Promise.all(
      batches.map(
        async ({
          start,
          images: batchImages,
        }) => {
          const userContent =
            batchImages.flatMap(
              (imageUrl, index) => {
                const photoNumber =
                  start + index + 1;

                return [
                  {
                    type:
                      "input_text",
                    text:
                      `PHOTO ${photoNumber}`,
                  },
                  {
                    type:
                      "input_image",
                    image_url:
                      imageUrl,
                    detail: "high",
                  },
                ];
              }
            );

          const raw =
            await callStructured<{
              photos: PhotoAnalysis[];
            }>({
              apiKey,
              model,
              schemaName:
                `walknwow_photo_batch_${start + 1}`,
              schema:
                PHOTO_BATCH_SCHEMA,
              maxOutputTokens: 5000,
              systemPrompt: `
You are the vision analyst for WalkNWow Director V3.1.

Analyze each numbered real-estate listing photo in this batch.

For every photo:
- classify the room or exterior category
- provide a clear room label
- score visual quality
- score buyer storytelling value
- score image-to-video animation suitability
- flag distortion and blur risk
- identify visible buyer-relevant features
- recommend keeping or skipping
- identify true duplicates only when the view is materially redundant

IMPORTANT:
duplicateOf may reference only a lower-numbered photo visible in this same batch. Otherwise use 0.
Do not skip a unique room, bedroom, bathroom, amenity, exterior area, view, hallway, stairway, office, garage, basement, patio, pool, or useful layout angle.
Skip only a true duplicate, an unusably weak image, or a photo that adds no meaningful spatial or feature information.
Return exactly one analysis object for every supplied photo.
`,
              userContent,
            });

          return batchImages.map(
            (_, index) => {
              const photoNumber =
                start + index + 1;

              const matching =
                raw.photos.find(
                  (photo) =>
                    photo.photoNumber ===
                    photoNumber
                ) ??
                raw.photos[index] ??
                ({} as PhotoAnalysis);

              return normalizePhoto(
                matching,
                photoNumber,
                images.length
              );
            }
          );
        }
      )
    );

  return results
    .flat()
    .sort(
      (a, b) =>
        a.photoNumber -
        b.photoNumber
    );
}

function chooseDNAImages(
  images: string[],
  photos: PhotoAnalysis[]
): string[] {
  const preferredCategories = [
    "front_exterior",
    "rear_exterior",
    "aerial",
    "entry",
    "foyer",
    "living_room",
    "family_room",
    "kitchen",
    "primary_bedroom",
    "primary_bathroom",
    "patio_deck",
    "backyard",
    "pool",
    "view",
  ];

  const chosen =
    new Set<number>();

  for (const category of preferredCategories) {
    const best = photos
      .filter(
        (photo) =>
          photo.category ===
            category &&
          photo.duplicateOf === 0
      )
      .sort(
        (a, b) =>
          b.qualityScore +
            b.storytellingScore -
          (a.qualityScore +
            a.storytellingScore)
      )[0];

    if (best) {
      chosen.add(
        best.photoNumber
      );
    }

    if (chosen.size >= 12) {
      break;
    }
  }

  for (const photo of [...photos].sort(
    (a, b) =>
      b.qualityScore +
        b.storytellingScore -
      (a.qualityScore +
        a.storytellingScore)
  )) {
    if (chosen.size >= 12) {
      break;
    }

    if (
      photo.duplicateOf === 0
    ) {
      chosen.add(
        photo.photoNumber
      );
    }
  }

  return Array.from(chosen)
    .map(
      (photoNumber) =>
        images[photoNumber - 1]
    )
    .filter(Boolean);
}

async function buildPropertyDNA(
  apiKey: string,
  model: string,
  images: string[],
  photos: PhotoAnalysis[]
): Promise<{
  propertySummary: string;
  propertyDNA: PropertyDNA;
}> {
  const dnaImages =
    chooseDNAImages(
      images,
      photos
    );

  const userContent =
    dnaImages.flatMap(
      (imageUrl, index) => [
        {
          type: "input_text",
          text:
            `REPRESENTATIVE PROPERTY IMAGE ${index + 1}`,
        },
        {
          type: "input_image",
          image_url: imageUrl,
          detail: "high",
        },
      ]
    );

  return await callStructured<{
    propertySummary: string;
    propertyDNA: PropertyDNA;
  }>({
    apiKey,
    model,
    schemaName:
      "walknwow_property_dna",
    schema: DNA_SCHEMA,
    maxOutputTokens: 3500,
    systemPrompt: `
You are the Property DNA specialist for WalkNWow.

Study the representative listing photos and build one consistent visual memory for the same property.

Record only clearly visible facts.
Use "Not clearly visible" when uncertain.
Do not invent materials, finishes, amenities, rooms, architecture, or colors.

The continuity rules must be concise and directly protect:
- siding
- roof
- windows
- doors
- flooring
- walls
- ceilings
- cabinetry
- counters
- appliances
- fixtures
- mirrors
- glass
- furniture
- landscaping
- pools
- fences
- views

The property summary should briefly describe the property and its strongest selling features.
`,
    userContent,
  });
}

async function buildStory(
  apiKey: string,
  model: string,
  photos: PhotoAnalysis[],
  propertySummary: string
): Promise<{
  selectedPhotoNumbers: number[];
  scenes: StoryScene[];
  coverageScore: number;
  storytellingScore: number;
  continuityScore: number;
  directorNotes: string[];
}> {
  const photoCatalog =
    photos.map((photo) => ({
      photoNumber:
        photo.photoNumber,
      category: photo.category,
      roomLabel:
        photo.roomLabel,
      qualityScore:
        photo.qualityScore,
      storytellingScore:
        photo.storytellingScore,
      animationSuitabilityScore:
        photo.animationSuitabilityScore,
      distortionRisk:
        photo.distortionRisk,
      blurRisk:
        photo.blurRisk,
      duplicateOf:
        photo.duplicateOf,
      visibleFeatures:
        photo.visibleFeatures,
      includeRecommendation:
        photo.includeRecommendation,
      reason: photo.reason,
    }));

  return await callStructured<{
    selectedPhotoNumbers: number[];
    scenes: StoryScene[];
    coverageScore: number;
    storytellingScore: number;
    continuityScore: number;
    directorNotes: string[];
  }>({
    apiKey,
    model,
    schemaName:
      "walknwow_story_director",
    schema: STORY_SCHEMA,
    maxOutputTokens: 6000,
    systemPrompt: `
You are the Story Director for WalkNWow.

You receive a text catalog describing every listing photo. No image analysis is needed.

Build a complete, efficient, professional real-estate walkthrough.

SELECTION:
- do not target a specific scene count; select only genuinely valuable unique scenes
- scene count should be determined by property coverage and quality, not by filling a quota
- select only the strongest, most useful photo for each room or area by default
- include a second angle only when it clearly reveals layout, scale, or a major feature not visible in the stronger angle
- aggressively reject duplicate and near-duplicate photos
- if two photos show essentially the same room, furniture arrangement, exterior view, or camera angle, keep only the stronger one
- do not select extra photos just to reach a target count
- skip decorative close-ups, repeated exterior angles, repeated kitchen angles, repeated bedroom angles, weak hallway shots, redundant bathroom angles, and photos with little storytelling value
- cover every important major space, but combine redundant coverage and do not include every minor room or alternate angle
- every selected photo must contribute new visual or spatial information
- prioritize unique coverage over quantity
- prefer a shorter, stronger walkthrough over a long repetitive one

ORDER:
1. strongest exterior or aerial opener
2. approach, front door, entry, or foyer
3. connected main living spaces
4. kitchen and dining
5. office or flex spaces
6. primary suite
7. secondary bedrooms and bathrooms
8. basement, garage, gym, theater, game room, guest house, or other amenities
9. patio, backyard, pool, dock, views, or other outdoor spaces
10. strongest exterior or view closer

Do not jump randomly between indoor and outdoor areas.
Group related spaces together.
Keep floor flow as natural as the catalog allows.

CAMERA:
- slow forward gimbal glide
- subtle doorway reveal
- restrained micro-push for high-risk geometry
- no orbiting, spinning, sweeping pans, or dramatic zoom
- high-risk bathroom, mirror, stair, railing, and cabinetry scenes should use micro movement

SPEED:
- ordinary scenes: 3 to 4 seconds
- high-risk scenes: 2.5 to 3.5 seconds
- hero scenes: up to 5 seconds
- remove genuine redundancy so the project can approach a ten-minute production target

selectedPhotoNumbers and scenes must contain the same photos in the same final story order.
`,
    userContent: [
      {
        type: "input_text",
        text:
          `PROPERTY SUMMARY:\n${propertySummary}\n\nPHOTO CATALOG:\n${JSON.stringify(photoCatalog)}`,
      },
    ],
  });
}

function fallbackDNA(): {
  propertySummary: string;
  propertyDNA: PropertyDNA;
} {
  const preserve =
    "Preserve source imagery";

  return {
    propertySummary:
      "Complete residential property walkthrough.",
    propertyDNA: {
      propertyType:
        "Residential property",
      architecturalStyle:
        "Not clearly visible",
      luxuryLevel:
        "Not clearly visible",
      exterior: {
        siding: preserve,
        roof: preserve,
        windows: preserve,
        doors: preserve,
        garage: preserve,
        driveway: preserve,
        landscaping: preserve,
      },
      interior: {
        flooring: preserve,
        walls: preserve,
        ceilings: preserve,
        trim: preserve,
        lighting: preserve,
        colorPalette: preserve,
      },
      kitchen: {
        cabinets: preserve,
        countertops: preserve,
        backsplash: preserve,
        appliances: preserve,
        island: preserve,
        hardware: preserve,
      },
      livingAreas: {
        fireplace: preserve,
        windows: preserve,
        ceilingFeatures:
          preserve,
        builtIns: preserve,
      },
      bedrooms: {
        flooring: preserve,
        walls: preserve,
        windows: preserve,
      },
      bathrooms: {
        vanities: preserve,
        tile: preserve,
        mirrors: preserve,
        fixtures: preserve,
        glass: preserve,
      },
      outdoor: {
        patio: preserve,
        pool: preserve,
        fencing: preserve,
        views: preserve,
        amenities: [],
      },
      standoutFeatures: [],
      continuityRules: [
        "Preserve every visible architectural line exactly.",
        "Do not add, remove, replace, repaint, or move anything.",
        "Keep furniture, fixtures, landscaping, and views stationary.",
      ],
    },
  };
}

function fallbackStory(
  photos: PhotoAnalysis[]
): {
  selectedPhotoNumbers: number[];
  scenes: StoryScene[];
  coverageScore: number;
  storytellingScore: number;
  continuityScore: number;
  directorNotes: string[];
} {
  const selected =
    photos.filter(
      (photo) =>
        photo.duplicateOf === 0 &&
        photo.qualityScore >= 25 &&
        photo.includeRecommendation
    );

  const usable =
    (selected.length > 0
      ? selected
      : photos)
      .filter(
        (photo) =>
          photo.duplicateOf === 0
      )
      .sort(
        (a, b) =>
          (b.storytellingScore +
            b.qualityScore +
            b.animationSuitabilityScore) -
          (a.storytellingScore +
            a.qualityScore +
            a.animationSuitabilityScore)
      )
      ;

  return {
    selectedPhotoNumbers:
      usable.map(
        (photo) =>
          photo.photoNumber
      ),
    scenes: usable.map(
      (photo) => ({
        photoNumber:
          photo.photoNumber,
        importance:
          photo.storytellingScore >= 80
            ? "important"
            : "supporting",
        storyRole:
          photo.roomLabel,
        cameraMove:
          photo.distortionRisk ===
            "high"
            ? "Use an almost-static stabilized micro-push."
            : "Use a slow stabilized forward gimbal glide.",
        movementAmount:
          photo.distortionRisk ===
            "high"
            ? "micro"
            : "subtle",
        transitionIntent:
          "End naturally for a clean cut to the next property space.",
        preservationRules: [
          "Preserve every visible architectural line exactly.",
          "Do not add, remove, replace, or move anything.",
        ],
        estimatedDurationSeconds:
          photo.distortionRisk ===
            "high"
            ? 3
            : 3.5,
      })
    ),
    coverageScore: 85,
    storytellingScore: 70,
    continuityScore: 80,
    directorNotes: [
      "Deterministic story fallback used.",
    ],
  };
}

function combineOutput(
  photos: PhotoAnalysis[],
  dnaResult: {
    propertySummary: string;
    propertyDNA: PropertyDNA;
  },
  storyResult: {
    selectedPhotoNumbers: number[];
    scenes: StoryScene[];
    coverageScore: number;
    storytellingScore: number;
    continuityScore: number;
    directorNotes: string[];
  }
): DirectorOutput {
  const storySet = new Set(
    storyResult.selectedPhotoNumbers
  );

  const storyMap = new Map(
    storyResult.scenes.map(
      (scene) => [
        scene.photoNumber,
        scene,
      ]
    )
  );

  function roomKey(
    photo: PhotoAnalysis
  ): string {
    const value =
      `${photo.category} ${photo.roomLabel}`
        .toLowerCase()
        .replace(
          /\b(angle|alternate|alt|view|shot|photo)\s*#?\d*\b/g,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();

    if (
      /living room|family room|great room/.test(
        value
      )
    ) {
      return "main-living";
    }

    if (/kitchen/.test(value)) {
      return "kitchen";
    }

    if (
      /primary bedroom|master bedroom|primary suite|master suite/.test(
        value
      )
    ) {
      return "primary-bedroom";
    }

    if (
      /primary bath|master bath/.test(
        value
      )
    ) {
      return "primary-bath";
    }

    if (/dining/.test(value)) {
      return "dining";
    }

    if (
      /front exterior|exterior front|front elevation|front of home/.test(
        value
      )
    ) {
      return "front-exterior";
    }

    if (
      /rear exterior|back exterior|backyard/.test(
        value
      )
    ) {
      return "rear-exterior";
    }

    if (/pool/.test(value)) {
      return "pool";
    }

    if (/patio|deck/.test(value)) {
      return "patio-deck";
    }

    if (/aerial|drone/.test(value)) {
      return "aerial";
    }

    return value;
  }

  function importanceBonus(
    photo: PhotoAnalysis
  ): number {
    const value =
      `${photo.category} ${photo.roomLabel}`
        .toLowerCase();

    if (
      /front exterior|exterior front|hero|aerial/.test(
        value
      )
    ) {
      return 24;
    }

    if (
      /living|family room|great room|kitchen/.test(
        value
      )
    ) {
      return 24;
    }

    if (
      /primary bedroom|master bedroom|primary suite|master suite/.test(
        value
      )
    ) {
      return 22;
    }

    if (
      /primary bath|master bath/.test(
        value
      )
    ) {
      return 20;
    }

    if (
      /pool|backyard|patio|deck|waterfront|dock|view/.test(
        value
      )
    ) {
      return 19;
    }

    if (/dining/.test(value)) {
      return 18;
    }

    if (
      /office|theater|gym|game room|guest house|garage/.test(
        value
      )
    ) {
      return 15;
    }

    if (/bedroom/.test(value)) {
      return 13;
    }

    if (/bathroom|bath/.test(value)) {
      return 11;
    }

    if (
      /hallway|corridor|closet|laundry|detail/.test(
        value
      )
    ) {
      return -8;
    }

    return 6;
  }

  function riskAdjustment(
    value: RiskLevel
  ): number {
    if (value === "low") {
      return 5;
    }

    if (value === "medium") {
      return 0;
    }

    return -14;
  }

  function selectionScore(
    photo: PhotoAnalysis
  ): number {
    return (
      photo.qualityScore * 0.46 +
      photo.storytellingScore * 0.20 +
      photo.animationSuitabilityScore * 0.24 +
      importanceBonus(photo) +
      riskAdjustment(
        photo.distortionRisk
      ) +
      riskAdjustment(
        photo.blurRisk
      ) +
      (
        photo.includeRecommendation
          ? 4
          : -6
      ) +
      (
        storySet.has(
          photo.photoNumber
        )
          ? 6
          : 0
      )
    );
  }

  /*
   * IMPORTANT:
   * Story selection is only a bonus.
   * It is NOT a hard requirement, because the story model can
   * occasionally return an empty selection.
   */
  const rankedPhotos =
    [...photos]
      .filter(
        (photo) =>
          photo.duplicateOf === 0 &&
          photo.qualityScore >= 64 &&
          photo.animationSuitabilityScore >= 55 &&
          photo.blurRisk !== "high"
      )
      .sort(
        (a, b) =>
          selectionScore(b) -
          selectionScore(a)
      );

  const selected: number[] = [];
  const selectedSet =
    new Set<number>();
  const usedRooms =
    new Set<string>();

  /*
   * 27 source photos -> maximum around 16.
   * This is a ceiling, not a quota.
   */
  const maxScenes =
    Math.min(
      18,
      Math.max(
        10,
        Math.round(
          photos.length * 0.60
        )
      )
    );

  for (const photo of rankedPhotos) {
    if (
      selected.length >=
      maxScenes
    ) {
      break;
    }

    const score =
      selectionScore(photo);

    const key =
      roomKey(photo);

    if (
      selectedSet.has(
        photo.photoNumber
      ) ||
      usedRooms.has(key)
    ) {
      continue;
    }

    if (score < 74) {
      continue;
    }

    const label =
      `${photo.category} ${photo.roomLabel}`
        .toLowerCase();

    /*
     * Transitional/detail photos only survive when exceptional.
     */
    if (
      /hallway|corridor|closet|laundry|detail/.test(
        label
      ) &&
      score < 90
    ) {
      continue;
    }

    selected.push(
      photo.photoNumber
    );

    selectedSet.add(
      photo.photoNumber
    );

    usedRooms.add(key);
  }

  /*
   * Never return zero merely because the AI story step was strict.
   * Backfill only strong, unique rooms. Never select all photos.
   */
  if (
    selected.length <
    Math.min(10, photos.length)
  ) {
    const backfill =
      [...photos]
        .filter(
          (photo) =>
            photo.duplicateOf === 0 &&
            photo.qualityScore >= 58 &&
            photo.animationSuitabilityScore >= 50 &&
            photo.blurRisk !== "high"
        )
        .sort(
          (a, b) =>
            selectionScore(b) -
            selectionScore(a)
        );

    for (const photo of backfill) {
      if (
        selected.length >=
        Math.min(
          14,
          maxScenes
        )
      ) {
        break;
      }

      const key =
        roomKey(photo);

      if (
        selectedSet.has(
          photo.photoNumber
        ) ||
        usedRooms.has(key)
      ) {
        continue;
      }

      selected.push(
        photo.photoNumber
      );

      selectedSet.add(
        photo.photoNumber
      );

      usedRooms.add(key);
    }
  }

  const scenes:
    DirectorScene[] =
    photos.map((photo) => {
      const story =
        storyMap.get(
          photo.photoNumber
        );

      const include =
        selectedSet.has(
          photo.photoNumber
        );

      return {
        ...photo,
        sceneNumber:
          include
            ? selected.indexOf(
                photo.photoNumber
              ) + 1
            : 0,
        include,
        photoNumber:
          photo.photoNumber,
        importance:
          normalizeImportance(
            story?.importance
          ),
        storyRole: text(
          story?.storyRole,
          photo.roomLabel
        ),
        cameraMove: text(
          story?.cameraMove,
          photo.distortionRisk ===
            "high"
            ? "Use a restrained stabilized micro-push with visible depth."
            : "Use a slow stabilized forward gimbal glide with subtle parallax."
        ),
        movementAmount:
          story?.movementAmount ===
            "micro" ||
          story?.movementAmount ===
            "subtle" ||
          story?.movementAmount ===
            "moderate"
            ? story.movementAmount
            : photo.distortionRisk ===
                "high"
              ? "micro"
              : "subtle",
        transitionIntent:
          text(
            story?.transitionIntent,
            "End naturally for a clean cut."
          ),
        preservationRules:
          stringList(
            story?.preservationRules,
            15
          ).length > 0
            ? stringList(
                story?.preservationRules,
                15
              )
            : [
                "Preserve every visible architectural line exactly.",
                "Do not add, remove, replace, restage, or move anything.",
                "Maintain source-image identity during camera movement.",
              ],
        estimatedDurationSeconds:
          clampDuration(
            story?.estimatedDurationSeconds
          ),
      };
    });

  const skippedPhotos =
    scenes
      .filter(
        (scene) =>
          !scene.include
      )
      .map((scene) => ({
        photoNumber:
          scene.photoNumber,
        reason:
          scene.duplicateOf > 0
            ? `Duplicate of Photo ${scene.duplicateOf}. ${scene.reason}`
            : `Not selected by final quality, importance, animation-safety, and uniqueness gate. ${scene.reason}`,
      }));

  const estimatedRuntimeSeconds =
    Math.round(
      scenes
        .filter(
          (scene) =>
            scene.include
        )
        .reduce(
          (total, scene) =>
            total +
            scene.estimatedDurationSeconds,
          0
        )
    );

  return {
    version:
      "walknwow-director-v3.1",
    propertySummary:
      dnaResult.propertySummary,
    propertyDNA:
      dnaResult.propertyDNA,
    scenes,
    selectedPhotoNumbers:
      selected,
    skippedPhotos,
    estimatedRuntimeSeconds,
    coverageScore:
      clampScore(
        storyResult.coverageScore,
        85
      ),
    storytellingScore:
      clampScore(
        storyResult.storytellingScore,
        80
      ),
    continuityScore:
      clampScore(
        storyResult.continuityScore,
        85
      ),
    directorNotes:
      stringList(
        storyResult.directorNotes,
        30
      ),
  };
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as DirectorRequest;

    const images =
      validImages(body.images);

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid property images were provided.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OPENAI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const visionModel =
      process.env
        .OPENAI_DIRECTOR_VISION_MODEL
        ?.trim() ||
      "gpt-4.1-mini";

    const textModel =
      process.env
        .OPENAI_DIRECTOR_TEXT_MODEL
        ?.trim() ||
      "gpt-4.1-mini";

    let photos:
      PhotoAnalysis[];

    try {
      photos =
        await analyzePhotoBatches(
          apiKey,
          visionModel,
          images
        );
    } catch (error) {
      console.error(
        "Director V3.1 photo analysis failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? `Photo analysis failed: ${error.message}`
              : "Photo analysis failed.",
        },
        { status: 502 }
      );
    }

    let dnaResult =
      fallbackDNA();

    try {
      dnaResult =
        await buildPropertyDNA(
          apiKey,
          visionModel,
          images,
          photos
        );
    } catch (error) {
      console.error(
        "Director V3.1 DNA fallback:",
        error
      );
    }

    let storyResult;

    try {
      storyResult =
        await buildStory(
          apiKey,
          textModel,
          photos,
          dnaResult.propertySummary
        );
    } catch (error) {
      console.error(
        "Director V3.1 story fallback:",
        error
      );

      storyResult =
        fallbackStory(
          photos
        );
    }

    const director =
      combineOutput(
        photos,
        dnaResult,
        storyResult
      );

    return NextResponse.json({
      success: true,
      imageCount:
        images.length,
      director,
      usedFallback: false,
      stages: {
        photoAnalysis:
          "complete",
        propertyDNA:
          dnaResult.propertyDNA
            .architecturalStyle ===
          "Not clearly visible"
            ? "fallback"
            : "complete",
        story:
          storyResult.directorNotes.includes(
            "Deterministic story fallback used."
          )
            ? "fallback"
            : "complete",
      },
      message:
        `Director V3.1 selected ${director.selectedPhotoNumbers.length} of ${images.length} photos.`,
    });
  } catch (error) {
    console.error(
      "WalkNWow Director V3.1 error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Director V3.1 failed.",
      },
      { status: 500 }
    );
  }
}