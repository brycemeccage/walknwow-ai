export type SceneLifeCategory =
  | "water"
  | "foliage"
  | "weather"
  | "fabric"
  | "fire"
  | "fan"
  | "light"
  | "reflection"
  | "smoke";

export type SceneLifeElement = {
  name: string;
  category: SceneLifeCategory;
  instruction: string;
};

export type SceneLifeInput = {
  category?: string;
  roomLabel?: string;
  visibleFeatures?: string[];
  lockedObjects?: string[];
  criticalArchitecture?: string[];
};

export type SceneLifePlan = {
  category: string;
  roomLabel: string;
  cameraStyle: "locked" | "lateral" | "zoom_out";
  livingElements: SceneLifeElement[];
  staticElements: string[];
  lifeScoreTarget: number;
  generationInstruction: string;
  qualityChecklist: string[];
};

const TERMS: Record<SceneLifeCategory, string[]> = {
  water: ["water", "lake", "river", "ocean", "pool", "pond", "fountain", "wave", "shoreline"],
  foliage: ["tree", "leaf", "leaves", "bush", "shrub", "grass", "plant", "flower", "landscaping"],
  weather: ["cloud", "clouds", "fog", "sky"],
  fabric: ["curtain", "curtains", "drape", "drapes", "flag", "flags"],
  fire: ["fire", "fireplace", "flame", "candle", "fire pit"],
  fan: ["fan", "ceiling fan"],
  light: ["sunlight", "natural light", "shadow", "shadows"],
  reflection: ["reflection", "reflections", "mirror", "glass"],
  smoke: ["smoke", "steam"],
};

const MOTION: Record<SceneLifeCategory, string> = {
  water: "subtle continuous ripples or waves; keep shoreline and reflections stable",
  foliage: "gentle wind movement in leaves and branches only",
  weather: "very slow natural cloud or fog drift",
  fabric: "small natural flutter or sway without changing shape or position",
  fire: "soft realistic flame flicker without changing the fireplace or fire pit",
  fan: "slow realistic rotation only if the fan is already visible",
  light: "very subtle natural light variation with no exposure jump",
  reflection: "tiny natural shimmer while preserving the reflected scene",
  smoke: "light natural drift only if smoke or steam already exists",
};

const STATIC_TERMS = [
  "wall", "ceiling", "floor", "window", "door", "roof", "railing", "stairs",
  "cabinet", "countertop", "appliance", "sofa", "couch", "chair", "table",
  "bed", "painting", "art", "tv", "fixture", "dock", "deck", "patio", "fence"
];

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: unknown, max = 40): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(clean).filter(Boolean))).slice(0, max);
}

function includesAny(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function classify(name: string): SceneLifeCategory | null {
  for (const [category, terms] of Object.entries(TERMS) as [SceneLifeCategory, string[]][]) {
    if (includesAny(name, terms)) return category;
  }
  return null;
}

function chooseCamera(category: string, livingCount: number): "locked" | "lateral" | "zoom_out" {
  const exterior = new Set([
    "front_exterior", "rear_exterior", "backyard", "pool",
    "dock", "view", "patio_deck", "aerial"
  ]);

  if (livingCount > 0) return "locked";
  return exterior.has(category) ? "lateral" : "zoom_out";
}

function buildInstruction(plan: Omit<SceneLifePlan, "generationInstruction" | "qualityChecklist">): string {
  const life = plan.livingElements.length
    ? plan.livingElements.map((item) => `${item.name}: ${item.instruction}`).join("; ")
    : "No clear natural motion source detected.";

  const camera =
    plan.cameraStyle === "locked"
      ? "Keep the camera locked."
      : plan.cameraStyle === "lateral"
        ? "Use only a tiny smooth left-to-right or right-to-left move."
        : "Use only a tiny smooth zoom out.";

  return [
    "SCENE LIFE:",
    "Make the existing photograph feel like real video footage.",
    `Animate only these existing elements: ${life}.`,
    camera,
    "Never use up-and-down motion, tilt, vertical drift, orbit, roll, crane motion, or floating movement.",
    "Do not animate architecture, furniture, paintings, televisions, cabinets, fixtures, decks, docks, fences, or walls.",
    "Do not add any new object or motion source.",
    "The environment should create the life; camera motion must remain minimal."
  ].join(" ");
}

function buildChecklist(plan: Omit<SceneLifePlan, "generationInstruction" | "qualityChecklist">): string[] {
  return [
    ...plan.livingElements.map((item) => `Verify that ${item.name} shows subtle natural motion.`),
    "Verify that the clip does not feel like a dead still image.",
    "Verify that there is no up-and-down camera movement.",
    "Verify that camera movement is only locked, lateral, or zoom-out.",
    "Verify that architecture and furniture remain unchanged.",
    "Verify that no new painting, plant, furniture, fixture, or decoration appears."
  ];
}

export function buildSceneLifePlan(input: SceneLifeInput): SceneLifePlan {
  const category = clean(input.category) || "other";
  const roomLabel = clean(input.roomLabel) || "Property Scene";
  const visibleFeatures = list(input.visibleFeatures);
  const lockedObjects = list(input.lockedObjects);
  const criticalArchitecture = list(input.criticalArchitecture);

  const livingElements = visibleFeatures
    .map((name) => {
      const category = classify(name);
      return category ? { name, category, instruction: MOTION[category] } : null;
    })
    .filter((item): item is SceneLifeElement => Boolean(item))
    .slice(0, 6);

  const staticElements = Array.from(new Set([
    ...visibleFeatures.filter((feature) => includesAny(feature, STATIC_TERMS)),
    ...lockedObjects,
    ...criticalArchitecture
  ])).slice(0, 30);

  const cameraStyle = chooseCamera(category, livingElements.length);
  const lifeScoreTarget = livingElements.length >= 3 ? 95 : livingElements.length >= 1 ? 85 : 70;

  const base = {
    category,
    roomLabel,
    cameraStyle,
    livingElements,
    staticElements,
    lifeScoreTarget,
  };

  return {
    ...base,
    generationInstruction: buildInstruction(base),
    qualityChecklist: buildChecklist(base),
  };
}

export function mergeSceneLifeIntoPrompt(
  basePrompt: string,
  plan: SceneLifePlan,
  maxLength = 950
): string {
  const base = clean(basePrompt);
  const full = `${base} ${clean(plan.generationInstruction)}`.trim();

  if (full.length <= maxLength) return full;

  const compact = [
    "LIFE:",
    plan.livingElements.length
      ? `Animate only ${plan.livingElements.slice(0, 4).map((item) => item.name).join(", ")}.`
      : "Use a tiny lateral move or zoom out only.",
    plan.cameraStyle === "locked"
      ? "Camera locked."
      : plan.cameraStyle === "lateral"
        ? "Tiny lateral movement only."
        : "Tiny zoom out only.",
    "No vertical movement. No new objects. Keep architecture and furniture unchanged."
  ].join(" ");

  const available = Math.max(0, maxLength - compact.length - 1);
  return `${base.slice(0, available)} ${compact}`.replace(/\s+/g, " ").trim();
}

export function summarizeSceneLife(plan: SceneLifePlan) {
  return {
    lifeScoreTarget: plan.lifeScoreTarget,
    livingElementCount: plan.livingElements.length,
    cameraStyle: plan.cameraStyle,
    livingElements: plan.livingElements.map((item) => item.name),
  };
}