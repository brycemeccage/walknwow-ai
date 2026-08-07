export type PreservationPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type LockedElementType =
  | "architecture"
  | "fixture"
  | "furniture"
  | "decor"
  | "landscape"
  | "water"
  | "view"
  | "reflection"
  | "material"
  | "other";

export type LockedElement = {
  name: string;
  type: LockedElementType;
  importance: PreservationPriority;
  visibleDescription?: string;
  mustRemainPresent: boolean;
  mustRemainStationary: boolean;
  mustRemainIdentical: boolean;
};

export type PropertyLockInput = {
  category?: string;
  roomLabel?: string;
  visibleFeatures?: string[];
  preservationRules?: string[];
  propertyIdentity?: string;
  criticalArchitecture?: string[];
  lockedObjects?: string[];
};

export type PropertyLock = {
  category: string;
  roomLabel: string;
  preservationPriority: PreservationPriority;
  lockedElements: LockedElement[];
  criticalArchitecture: string[];
  lockedObjects: string[];
  forbiddenChanges: string[];
  generationInstruction: string;
  qualityChecklist: string[];
};

const ARCHITECTURE_TERMS = [
  "window",
  "windows",
  "door",
  "doors",
  "wall",
  "walls",
  "ceiling",
  "beam",
  "beams",
  "column",
  "columns",
  "floor",
  "flooring",
  "stairs",
  "staircase",
  "railing",
  "railings",
  "roof",
  "roofline",
  "deck",
  "dock",
  "porch",
  "patio",
  "fireplace",
  "mantel",
  "cabinet",
  "cabinets",
  "countertop",
  "countertops",
  "island",
  "backsplash",
  "shower",
  "bathtub",
  "tub",
  "mirror",
  "mirrors",
  "fence",
  "shoreline",
  "pool",
];

const FIXTURE_TERMS = [
  "light",
  "lighting",
  "chandelier",
  "pendant",
  "fan",
  "faucet",
  "sink",
  "toilet",
  "appliance",
  "appliances",
  "range",
  "oven",
  "refrigerator",
  "dishwasher",
  "television",
  "tv",
];

const FURNITURE_TERMS = [
  "sofa",
  "couch",
  "chair",
  "chairs",
  "table",
  "coffee table",
  "bed",
  "beds",
  "dresser",
  "desk",
  "bench",
  "stool",
  "stools",
  "ottoman",
  "nightstand",
];

const DECOR_TERMS = [
  "painting",
  "paintings",
  "art",
  "artwork",
  "photo",
  "photograph",
  "rug",
  "curtain",
  "curtains",
  "plant",
  "plants",
  "vase",
  "lamp",
  "lamps",
];

const LANDSCAPE_TERMS = [
  "tree",
  "trees",
  "bush",
  "bushes",
  "shrub",
  "shrubs",
  "grass",
  "landscaping",
  "flower",
  "flowers",
  "garden",
  "mountain",
  "mountains",
  "lake",
  "river",
  "ocean",
  "water",
  "cloud",
  "clouds",
  "flag",
  "flags",
];

const HIGH_RISK_CATEGORIES = new Set([
  "bathroom",
  "primary_bathroom",
  "kitchen",
  "stairs",
  "hallway",
  "foyer",
  "pool",
  "dock",
  "aerial",
  "detail",
  "wine_cellar",
]);

const CRITICAL_RISK_CATEGORIES = new Set([
  "bathroom",
  "primary_bathroom",
  "stairs",
  "dock",
  "aerial",
]);

const DEFAULT_FORBIDDEN_CHANGES = [
  "Do not add any object, artwork, furniture, fixture, plant, decoration, structure, or landscape element.",
  "Do not remove any visible object or architectural element.",
  "Do not move, resize, rotate, recolor, replace, restage, or redesign anything.",
  "Do not alter windows, doors, walls, floors, ceilings, beams, railings, cabinetry, counters, appliances, mirrors, or reflections.",
  "Do not change room proportions, perspective, materials, lighting, landscaping, shoreline, waterline, horizon, or view.",
  "Do not reveal any area that is not visible in the source image.",
];

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function cleanList(
  values: unknown,
  maxItems = 40
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(cleanText)
        .filter(Boolean)
    )
  ).slice(0, maxItems);
}

function includesAny(
  value: string,
  terms: string[]
): boolean {
  const normalized = value.toLowerCase();

  return terms.some((term) =>
    normalized.includes(term)
  );
}

function classifyElement(
  name: string
): LockedElementType {
  if (includesAny(name, ARCHITECTURE_TERMS)) {
    return "architecture";
  }

  if (includesAny(name, FIXTURE_TERMS)) {
    return "fixture";
  }

  if (includesAny(name, FURNITURE_TERMS)) {
    return "furniture";
  }

  if (includesAny(name, DECOR_TERMS)) {
    return "decor";
  }

  if (includesAny(name, LANDSCAPE_TERMS)) {
    if (
      includesAny(name, [
        "lake",
        "river",
        "ocean",
        "water",
        "pool",
      ])
    ) {
      return "water";
    }

    if (
      includesAny(name, [
        "mountain",
        "view",
        "horizon",
      ])
    ) {
      return "view";
    }

    return "landscape";
  }

  if (
    includesAny(name, [
      "wood",
      "stone",
      "brick",
      "tile",
      "marble",
      "granite",
      "quartz",
      "metal",
      "glass",
    ])
  ) {
    return "material";
  }

  if (
    includesAny(name, [
      "reflection",
      "reflections",
    ])
  ) {
    return "reflection";
  }

  return "other";
}

function priorityForType(
  type: LockedElementType
): PreservationPriority {
  switch (type) {
    case "architecture":
    case "fixture":
    case "reflection":
      return "critical";

    case "furniture":
    case "decor":
    case "material":
      return "high";

    case "landscape":
    case "water":
    case "view":
      return "high";

    default:
      return "medium";
  }
}

function categoryPriority(
  category: string
): PreservationPriority {
  if (CRITICAL_RISK_CATEGORIES.has(category)) {
    return "critical";
  }

  if (HIGH_RISK_CATEGORIES.has(category)) {
    return "high";
  }

  return "medium";
}

function highestPriority(
  priorities: PreservationPriority[]
): PreservationPriority {
  const order: PreservationPriority[] = [
    "low",
    "medium",
    "high",
    "critical",
  ];

  return priorities.reduce(
    (highest, current) =>
      order.indexOf(current) >
      order.indexOf(highest)
        ? current
        : highest,
    "low"
  );
}

function createLockedElement(
  name: string
): LockedElement {
  const type = classifyElement(name);
  const importance = priorityForType(type);

  return {
    name,
    type,
    importance,
    visibleDescription: name,
    mustRemainPresent: true,
    mustRemainStationary:
      type !== "water" &&
      type !== "landscape",
    mustRemainIdentical: true,
  };
}

function buildGenerationInstruction(
  lock: Omit<
    PropertyLock,
    "generationInstruction" |
      "qualityChecklist"
  >
): string {
  const elements = lock.lockedElements
    .slice(0, 18)
    .map((element) => element.name)
    .join(", ");

  const architecture =
    lock.criticalArchitecture
      .slice(0, 10)
      .join(", ");

  return [
    "PROPERTY LOCK:",
    "Treat the source image as an immutable record of the real property.",
    elements
      ? `Locked visible elements: ${elements}.`
      : "",
    architecture
      ? `Critical architecture: ${architecture}.`
      : "",
    "Every locked element must remain present, stationary, identical in shape, size, position, color, material, and count.",
    "Do not add artwork, decorations, furniture, fixtures, plants, structures, reflections, or landscape elements.",
    "Do not remove, move, resize, replace, recolor, bend, stretch, redesign, or invent anything.",
    "Only existing water, leaves, trees, flags, clouds, curtains, fans, or flames may show extremely subtle natural motion when already visible.",
    "Keep the camera effectively locked and preserve the exact perspective.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildQualityChecklist(
  lock: Omit<
    PropertyLock,
    "generationInstruction" |
      "qualityChecklist"
  >
): string[] {
  const checks = lock.lockedElements
    .slice(0, 25)
    .map(
      (element) =>
        `Verify that "${element.name}" remains present and visually identical to the source image.`
    );

  return [
    ...checks,
    "Verify that no new artwork, furniture, fixtures, plants, decorations, structures, or landscape elements appeared.",
    "Verify that no source element disappeared or changed position.",
    "Verify that windows, doors, walls, floors, ceilings, beams, railings, cabinetry, counters, mirrors, and reflections are unchanged.",
    "Verify that perspective, proportions, materials, lighting, shoreline, horizon, and view remain unchanged.",
  ];
}

export function buildPropertyLock(
  input: PropertyLockInput
): PropertyLock {
  const category =
    cleanText(input.category) || "other";

  const roomLabel =
    cleanText(input.roomLabel) ||
    "Property Scene";

  const visibleFeatures =
    cleanList(input.visibleFeatures);

  const suppliedLockedObjects =
    cleanList(input.lockedObjects);

  const suppliedArchitecture =
    cleanList(input.criticalArchitecture);

  const propertyIdentity =
    cleanText(input.propertyIdentity);

  const identityFragments =
    propertyIdentity
      ? propertyIdentity
          .split(/[.;]/)
          .map(cleanText)
          .filter(Boolean)
          .slice(0, 12)
      : [];

  const allNames = Array.from(
    new Set([
      ...visibleFeatures,
      ...suppliedLockedObjects,
      ...suppliedArchitecture,
      ...identityFragments,
    ])
  ).slice(0, 40);

  const lockedElements =
    allNames.map(createLockedElement);

  const criticalArchitecture =
    Array.from(
      new Set([
        ...suppliedArchitecture,
        ...lockedElements
          .filter(
            (element) =>
              element.type === "architecture"
          )
          .map((element) => element.name),
      ])
    ).slice(0, 20);

  const lockedObjects =
    Array.from(
      new Set([
        ...suppliedLockedObjects,
        ...lockedElements
          .filter(
            (element) =>
              element.type !== "architecture"
          )
          .map((element) => element.name),
      ])
    ).slice(0, 25);

  const preservationPriority =
    highestPriority([
      categoryPriority(category),
      ...lockedElements.map(
        (element) => element.importance
      ),
    ]);

  const baseLock = {
    category,
    roomLabel,
    preservationPriority,
    lockedElements,
    criticalArchitecture,
    lockedObjects,
    forbiddenChanges: [
      ...DEFAULT_FORBIDDEN_CHANGES,
      ...cleanList(
        input.preservationRules,
        12
      ),
    ],
  };

  return {
    ...baseLock,
    generationInstruction:
      buildGenerationInstruction(baseLock),
    qualityChecklist:
      buildQualityChecklist(baseLock),
  };
}

export function mergePropertyLockIntoPrompt(
  basePrompt: string,
  lock: PropertyLock,
  maxLength = 950
): string {
  const cleanedBase =
    cleanText(basePrompt);

  const lockText =
    cleanText(lock.generationInstruction);

  const combined =
    `${cleanedBase} ${lockText}`.trim();

  if (combined.length <= maxLength) {
    return combined;
  }

  const compactLock = [
    "PROPERTY LOCK:",
    lock.lockedElements.length > 0
      ? `Preserve exactly: ${lock.lockedElements
          .slice(0, 12)
          .map((element) => element.name)
          .join(", ")}.`
      : "",
    "No additions, removals, movement, redesign, recoloring, replacement, changed perspective, or unseen areas.",
    "Camera locked. Only already-visible natural environmental elements may move subtly.",
  ]
    .filter(Boolean)
    .join(" ");

  const available =
    Math.max(
      0,
      maxLength -
        compactLock.length -
        1
    );

  return `${cleanedBase.slice(
    0,
    available
  )} ${compactLock}`
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizePropertyLock(
  lock: PropertyLock
): {
  lockedCount: number;
  architectureCount: number;
  objectCount: number;
  preservationPriority: PreservationPriority;
} {
  return {
    lockedCount:
      lock.lockedElements.length,
    architectureCount:
      lock.criticalArchitecture.length,
    objectCount:
      lock.lockedObjects.length,
    preservationPriority:
      lock.preservationPriority,
  };
}