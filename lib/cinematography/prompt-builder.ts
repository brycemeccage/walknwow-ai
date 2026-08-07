import type { CinematographyProfile } from "./profile-mapper";

export type PromptBuilderInput = {
  profile: CinematographyProfile;
  roomLabel?: string;
  storyRole?: string;
  visibleFeatures?: string[];
  propertyIdentity?: string;
  continuityRules?: string[];
  preservationRules?: string[];
};

const MAX_PROMPT_LENGTH = 700;

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function cleanList(
  values: string[] | undefined,
  maxItems: number,
  maxItemLength = 60
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(cleanText)
    .filter(Boolean)
    .map((value) =>
      value.slice(0, maxItemLength)
    )
    .slice(0, maxItems);
}

function compact(
  value: string
): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function trimToLimit(
  prompt: string
): string {
  const normalized = compact(prompt);

  if (
    normalized.length <=
    MAX_PROMPT_LENGTH
  ) {
    return normalized;
  }

  const ending =
    " Camera locked. Preserve the exact property. No additions, removals, blur, movement, redesign, or new objects.";

  const available =
    MAX_PROMPT_LENGTH -
    ending.length;

  return (
    normalized
      .slice(0, Math.max(0, available))
      .replace(/[\s,;:.!?-]+$/g, "") +
    ending
  );
}

function naturalMotionForCategory(
  category: string
): string {
  switch (category) {
    case "front_exterior":
    case "rear_exterior":
    case "backyard":
    case "patio_deck":
    case "view":
    case "dock":
    case "pool":
    case "aerial":
      return "Only existing water, leaves, trees, flags, clouds, or flames may move slightly.";

    default:
      return "Keep all visible objects and scene elements completely still.";
  }
}

export function buildCinematographyPrompt(
  input: PromptBuilderInput
): string {
  const {
    profile,
    roomLabel,
    storyRole,
    visibleFeatures,
    propertyIdentity,
    continuityRules,
    preservationRules,
  } = input;

  const room =
    cleanText(roomLabel) ||
    profile.room.label;

  const role =
    cleanText(storyRole) ||
    "real-estate listing scene";

  const features =
    cleanList(
      visibleFeatures,
      4
    );

  const continuity =
    cleanList(
      continuityRules,
      3
    );

  const preservation =
    cleanList(
      preservationRules,
      3
    );

  const identity =
    cleanText(propertyIdentity)
      .slice(0, 120);

  const prompt = `
Animate this exact real-estate photograph. Do not create a new scene.

Scene: ${room}. Purpose: ${role}.

Use a locked tripod camera.
No pan, tilt, orbit, zoom, dolly, slide, roll, drift, or perspective change.
Do not reveal unseen areas.
${naturalMotionForCategory(profile.category)}

Preserve exactly: ${
    features.length > 0
      ? features.join(", ")
      : "every visible feature"
  }.

Property identity: ${
    identity ||
    "use only the exact source image"
  }.

Continuity: ${
    continuity.length > 0
      ? continuity.join("; ")
      : "keep architecture, furniture, fixtures, decor, landscaping, reflections, lighting, colors, and proportions unchanged"
  }.

Extra rules: ${
    preservation.length > 0
      ? preservation.join("; ")
      : "none"
  }.

Do not add paintings, artwork, plants, lamps, pillows, furniture, fixtures, decorations, windows, doors, landscaping, or objects of any kind.
Do not remove, move, resize, replace, recolor, restage, redesign, bend, stretch, or invent anything.
Begin fully sharp. Stay fully sharp. End fully sharp and stable.
No focus settling, opening blur, motion smear, flicker, exposure change, or depth-of-field shift.
`;

  return trimToLimit(prompt);
}

export function getPromptLength(
  prompt: string
): number {
  return prompt.length;
}