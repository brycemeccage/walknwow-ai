export type LensProfileKey =
  | "wide18"
  | "wide24"
  | "natural28"
  | "detail35";

export type LensProfile = {
  key: LensProfileKey;
  label: string;
  equivalentFocalLength: string;
  instruction: string;
  distortionRisk: "low" | "medium" | "high";
};

export const LENS_PROFILES: Record<
  LensProfileKey,
  LensProfile
> = {
  wide18: {
    key: "wide18",
    label: "18mm Wide",
    equivalentFocalLength: "18mm equivalent",
    instruction:
      "Preserve the existing wide-angle composition without stretching walls, furniture, or room proportions.",
    distortionRisk: "high",
  },

  wide24: {
    key: "wide24",
    label: "24mm Architectural",
    equivalentFocalLength: "24mm equivalent",
    instruction:
      "Use a natural architectural-wide perspective with straight vertical and horizontal lines.",
    distortionRisk: "medium",
  },

  natural28: {
    key: "natural28",
    label: "28mm Natural",
    equivalentFocalLength: "28mm equivalent",
    instruction:
      "Use a restrained natural perspective suitable for bathrooms, bedrooms, stairs, and tighter rooms.",
    distortionRisk: "low",
  },

  detail35: {
    key: "detail35",
    label: "35mm Detail",
    equivalentFocalLength: "35mm equivalent",
    instruction:
      "Preserve the exact detail framing with almost no perspective change.",
    distortionRisk: "low",
  },
};

export function getLensProfile(
  key: LensProfileKey
): LensProfile {
  return LENS_PROFILES[key];
}
