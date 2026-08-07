import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type PropertyBrainRequest = {
  images?: unknown;
};

type PropertyPhotoAnalysis = {
  photoNumber: number;
  category: string;
  qualityScore: number;
  storytellingScore: number;
  distortionRisk: "low" | "medium" | "high";
  decision: "keep" | "skip";
  storyRole: string;
  reason: string;
  duplicateOf: number;
  visibleFeatures: string[];
};

type PropertyBrainAnalysis = {
  propertyType: string;
  overallQualityScore: number;
  propertySummary: string;
  propertyMemory: {
    exterior: string;
    frontDoor: string;
    roof: string;
    windows: string;
    kitchen: string;
    flooring: string;
    fireplace: string;
    landscaping: string;
    standoutFeatures: string[];
  };
  recommendedSequence: number[];
  photos: PropertyPhotoAnalysis[];
  skippedSummary: Array<{
    photoNumber: number;
    reason: string;
  }>;
  directorNotes: string[];
};

type ResponsesApiResponse = {
  status?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
  incomplete_details?: {
    reason?: string;
  };
};

const propertyBrainSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    propertyType: {
      type: "string",
      description:
        "Short visual description of the property style, such as Colonial, Modern Farmhouse, Condo, or Unknown.",
    },
    overallQualityScore: {
      type: "integer",
      description:
        "A whole-number score from 0 to 100 for the usefulness and visual quality of the complete photo set.",
    },
    propertySummary: {
      type: "string",
      description:
        "Concise summary of the property's visible style, layout, and standout marketing features.",
    },
    propertyMemory: {
      type: "object",
      additionalProperties: false,
      properties: {
        exterior: { type: "string" },
        frontDoor: { type: "string" },
        roof: { type: "string" },
        windows: { type: "string" },
        kitchen: { type: "string" },
        flooring: { type: "string" },
        fireplace: { type: "string" },
        landscaping: { type: "string" },
        standoutFeatures: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "exterior",
        "frontDoor",
        "roof",
        "windows",
        "kitchen",
        "flooring",
        "fireplace",
        "landscaping",
        "standoutFeatures",
      ],
    },
    recommendedSequence: {
      type: "array",
      description:
        "Original photo numbers in the best cinematic walkthrough order. Include only photos marked keep.",
      items: {
        type: "integer",
      },
    },
    photos: {
      type: "array",
      description:
        "One analysis object for every supplied photo, in original photo-number order.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          photoNumber: {
            type: "integer",
          },
          category: {
            type: "string",
            enum: [
              "front_exterior",
              "rear_exterior",
              "aerial",
              "entry",
              "foyer",
              "living_room",
              "family_room",
              "kitchen",
              "dining_room",
              "bedroom",
              "primary_bedroom",
              "bathroom",
              "primary_bathroom",
              "office",
              "hallway",
              "stairs",
              "laundry",
              "garage",
              "basement",
              "patio_deck",
              "backyard",
              "pool",
              "view",
              "amenity",
              "detail_closeup",
              "floor_plan",
              "map",
              "other",
            ],
          },
          qualityScore: {
            type: "integer",
          },
          storytellingScore: {
            type: "integer",
          },
          distortionRisk: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          decision: {
            type: "string",
            enum: ["keep", "skip"],
          },
          storyRole: {
            type: "string",
          },
          reason: {
            type: "string",
          },
          duplicateOf: {
            type: "integer",
            description:
              "The kept original photo number this duplicates, or 0 when it is not a duplicate.",
          },
          visibleFeatures: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "photoNumber",
          "category",
          "qualityScore",
          "storytellingScore",
          "distortionRisk",
          "decision",
          "storyRole",
          "reason",
          "duplicateOf",
          "visibleFeatures",
        ],
      },
    },
    skippedSummary: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          photoNumber: {
            type: "integer",
          },
          reason: {
            type: "string",
          },
        },
        required: ["photoNumber", "reason"],
      },
    },
    directorNotes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "propertyType",
    "overallQualityScore",
    "propertySummary",
    "propertyMemory",
    "recommendedSequence",
    "photos",
    "skippedSummary",
    "directorNotes",
  ],
} as const;

function extractOutputText(response: ResponsesApiResponse): string {
  for (const outputItem of response.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.type === "refusal" && contentItem.refusal) {
        throw new Error(contentItem.refusal);
      }

      if (contentItem.type === "output_text" && contentItem.text) {
        return contentItem.text;
      }
    }
  }

  return "";
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeAnalysis(
  analysis: PropertyBrainAnalysis,
  imageCount: number
): PropertyBrainAnalysis {
  const photoMap = new Map<number, PropertyPhotoAnalysis>();

  for (const photo of Array.isArray(analysis.photos)
    ? analysis.photos
    : []) {
    const photoNumber = Math.round(Number(photo.photoNumber));

    if (
      !Number.isInteger(photoNumber) ||
      photoNumber < 1 ||
      photoNumber > imageCount ||
      photoMap.has(photoNumber)
    ) {
      continue;
    }

    const duplicateOf = Math.round(Number(photo.duplicateOf));

    photoMap.set(photoNumber, {
      ...photo,
      photoNumber,
      qualityScore: clampScore(Number(photo.qualityScore)),
      storytellingScore: clampScore(
        Number(photo.storytellingScore)
      ),
      duplicateOf:
        duplicateOf >= 1 &&
        duplicateOf <= imageCount &&
        duplicateOf !== photoNumber
          ? duplicateOf
          : 0,
      visibleFeatures: Array.isArray(photo.visibleFeatures)
        ? photo.visibleFeatures.filter(
            (feature): feature is string =>
              typeof feature === "string"
          )
        : [],
    });
  }

  for (let photoNumber = 1; photoNumber <= imageCount; photoNumber++) {
    if (!photoMap.has(photoNumber)) {
      photoMap.set(photoNumber, {
        photoNumber,
        category: "other",
        qualityScore: 0,
        storytellingScore: 0,
        distortionRisk: "high",
        decision: "skip",
        storyRole: "Skip",
        reason:
          "Property Brain did not return a reliable analysis for this photo.",
        duplicateOf: 0,
        visibleFeatures: [],
      });
    }
  }

  const photos = Array.from(photoMap.values()).sort(
    (a, b) => a.photoNumber - b.photoNumber
  );

  const keepNumbers = new Set(
    photos
      .filter((photo) => photo.decision === "keep")
      .map((photo) => photo.photoNumber)
  );

  const seenSequence = new Set<number>();

  let recommendedSequence = (
    Array.isArray(analysis.recommendedSequence)
      ? analysis.recommendedSequence
      : []
  )
    .map((value) => Math.round(Number(value)))
    .filter(
      (photoNumber) =>
        keepNumbers.has(photoNumber) &&
        !seenSequence.has(photoNumber) &&
        seenSequence.add(photoNumber)
    )
    .slice(0, 15);

  if (recommendedSequence.length === 0) {
    recommendedSequence = photos
      .filter((photo) => photo.decision === "keep")
      .sort(
        (a, b) =>
          b.storytellingScore - a.storytellingScore ||
          b.qualityScore - a.qualityScore
      )
      .slice(0, 15)
      .map((photo) => photo.photoNumber);
  }

  const skippedSummary = photos
    .filter((photo) => photo.decision === "skip")
    .map((photo) => ({
      photoNumber: photo.photoNumber,
      reason: photo.reason,
    }));

  return {
    ...analysis,
    overallQualityScore: clampScore(
      Number(analysis.overallQualityScore)
    ),
    recommendedSequence,
    photos,
    skippedSummary,
    directorNotes: Array.isArray(analysis.directorNotes)
      ? analysis.directorNotes.filter(
          (note): note is string => typeof note === "string"
        )
      : [],
    propertyMemory: {
      exterior: analysis.propertyMemory?.exterior ?? "Unknown",
      frontDoor: analysis.propertyMemory?.frontDoor ?? "Unknown",
      roof: analysis.propertyMemory?.roof ?? "Unknown",
      windows: analysis.propertyMemory?.windows ?? "Unknown",
      kitchen: analysis.propertyMemory?.kitchen ?? "Unknown",
      flooring: analysis.propertyMemory?.flooring ?? "Unknown",
      fireplace: analysis.propertyMemory?.fireplace ?? "Unknown",
      landscaping:
        analysis.propertyMemory?.landscaping ?? "Unknown",
      standoutFeatures: Array.isArray(
        analysis.propertyMemory?.standoutFeatures
      )
        ? analysis.propertyMemory.standoutFeatures.filter(
            (feature): feature is string =>
              typeof feature === "string"
          )
        : [],
    },
  };
}

async function requestPropertyAnalysis(
  apiKey: string,
  model: string,
  images: string[]
): Promise<PropertyBrainAnalysis> {
  const instructions = `
You are Property Brain, an elite real-estate video director.

Analyze all supplied listing photos together as one connected property.
Images are labeled Photo 1, Photo 2, and so on in original listing order.

Choose the strongest truthful cinematic story, normally 10 to 15 shots.
Use fewer when the listing does not contain enough strong and meaningfully
different images. Fewer excellent shots are better than filler.

KEEP photos that:
- establish the property clearly
- show major rooms or valuable amenities
- are sharp, well lit, well composed, and meaningfully different
- add a useful step to the property story

SKIP photos that are:
- exact duplicates or near-duplicates
- redundant angles of the same room
- blurry, dark, overexposed, obstructed, crooked, or weak
- maps, floor plans, text slides, signs, or unrelated graphics
- unimportant closets, hallways, utility rooms, or filler
- risky tight architectural close-ups unless essential

Mark distortion risk HIGH for:
- tight close-ups of unusual doors or windows
- curved geometry, mirrors, glass, railings, fences, lattice, or stairs
- dense repeating lines or extreme wide-angle perspective
- objects and walls cut off very close to the camera
- any image where small geometry changes could misrepresent the property

Build a balanced walkthrough:
1. strongest exterior opener
2. approach or entry when useful
3. main living spaces
4. kitchen and dining
5. primary bedroom and bathroom
6. only distinctive secondary spaces
7. backyard, patio, pool, view, or standout amenity
8. strongest closing shot

Duplicate rules:
- keep the strongest version
- set duplicateOf to that kept photo number
- use duplicateOf 0 when the photo is not a duplicate

Output rules:
- every supplied photo must appear exactly once in photos
- recommendedSequence may contain only photos marked keep
- recommendedSequence must use cinematic story order, not listing order
- do not invent rooms, materials, or property features that are not visible
- reasons must be specific and useful
`.trim();

  const content: Array<
    | {
        type: "input_text";
        text: string;
      }
    | {
        type: "input_image";
        image_url: string;
        detail: "low";
      }
  > = [
    {
      type: "input_text",
      text: instructions,
    },
  ];

  images.forEach((imageUrl, index) => {
    content.push({
      type: "input_text",
      text: `Photo ${index + 1}`,
    });

    content.push({
      type: "input_image",
      image_url: imageUrl,
      detail: "low",
    });
  });

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "user",
            content,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "property_brain_analysis",
            strict: true,
            schema: propertyBrainSchema,
          },
        },
        max_output_tokens: 12000,
      }),
      signal: AbortSignal.timeout(240000),
    }
  );

  const rawResponse = await response.text();

  let responseData: ResponsesApiResponse;

  try {
    responseData = JSON.parse(rawResponse) as ResponsesApiResponse;
  } catch {
    console.error("OpenAI returned non-JSON:", rawResponse);

    throw new Error(
      "OpenAI returned an unreadable response."
    );
  }

  if (!response.ok) {
    console.error("OpenAI Property Brain error:", responseData);

    const error = new Error(
      responseData.error?.message ??
        `OpenAI request failed with status ${response.status}.`
    );

    Object.assign(error, {
      code: responseData.error?.code,
      status: response.status,
    });

    throw error;
  }

  if (
    responseData.status === "incomplete" &&
    responseData.incomplete_details?.reason
  ) {
    throw new Error(
      `Property Brain response was incomplete: ${responseData.incomplete_details.reason}.`
    );
  }

  const outputText = extractOutputText(responseData);

  if (!outputText) {
    throw new Error(
      "OpenAI completed the request but returned no analysis."
    );
  }

  try {
    return JSON.parse(outputText) as PropertyBrainAnalysis;
  } catch {
    console.error(
      "Property Brain output was not valid JSON:",
      outputText
    );

    throw new Error(
      "Property Brain returned an unreadable analysis."
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PropertyBrainRequest;

    if (!Array.isArray(body.images)) {
      return NextResponse.json(
        {
          success: false,
          message: "The request must include an images array.",
        },
        { status: 400 }
      );
    }

    const images = body.images
      .filter(
        (image): image is string =>
          typeof image === "string" &&
          /^https?:\/\//i.test(image.trim())
      )
      .map((image) => image.trim())
      .slice(0, 30);

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid property images were received.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OPENAI_API_KEY is missing from .env.local.",
        },
        { status: 500 }
      );
    }

    const preferredModel =
      process.env.OPENAI_PROPERTY_BRAIN_MODEL?.trim() ||
      "gpt-5.6-luna";

    let analysis: PropertyBrainAnalysis;

    try {
      analysis = await requestPropertyAnalysis(
        apiKey,
        preferredModel,
        images
      );
    } catch (error) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error
          ? Number(error.status)
          : 0;

      const shouldTryFallback =
        preferredModel !== "gpt-5-mini" &&
        (status === 404 ||
          code === "model_not_found" ||
          code === "invalid_model");

      if (!shouldTryFallback) {
        throw error;
      }

      console.warn(
        `${preferredModel} was unavailable. Retrying Property Brain with gpt-5-mini.`
      );

      analysis = await requestPropertyAnalysis(
        apiKey,
        "gpt-5-mini",
        images
      );
    }

    const normalizedAnalysis = normalizeAnalysis(
      analysis,
      images.length
    );

    return NextResponse.json({
      success: true,
      imageCount: images.length,
      analysis: normalizedAnalysis,
    });
  } catch (error) {
    console.error("Property Brain route error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Property Brain could not analyze this listing.",
      },
      { status: 500 }
    );
  }
}