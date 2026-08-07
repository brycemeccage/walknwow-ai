export type VisionPhoto = {
  photoNumber: number;
  category: string;
  roomLabel: string;
  qualityScore: number;
  storytellingScore: number;
  animationSuitabilityScore: number;
  distortionRisk: "low" | "medium" | "high";
  blurRisk: "low" | "medium" | "high";
  duplicateOf: number;
  visibleFeatures: string[];
  includeRecommendation: boolean;
  reason: string;
};

export function normalizeVisionPhoto(
  value: Partial<VisionPhoto>,
  photoNumber: number
): VisionPhoto {
  return {
    photoNumber,
    category:
      typeof value.category === "string"
        ? value.category
        : "other",
    roomLabel:
      typeof value.roomLabel === "string"
        ? value.roomLabel
        : `Photo ${photoNumber}`,
    qualityScore:
      typeof value.qualityScore === "number"
        ? Math.max(0, Math.min(100, value.qualityScore))
        : 50,
    storytellingScore:
      typeof value.storytellingScore === "number"
        ? Math.max(
            0,
            Math.min(100, value.storytellingScore)
          )
        : 50,
    animationSuitabilityScore:
      typeof value.animationSuitabilityScore === "number"
        ? Math.max(
            0,
            Math.min(
              100,
              value.animationSuitabilityScore
            )
          )
        : 50,
    distortionRisk:
      value.distortionRisk === "low" ||
      value.distortionRisk === "high"
        ? value.distortionRisk
        : "medium",
    blurRisk:
      value.blurRisk === "low" ||
      value.blurRisk === "high"
        ? value.blurRisk
        : "medium",
    duplicateOf:
      Number.isInteger(value.duplicateOf) &&
      Number(value.duplicateOf) > 0
        ? Number(value.duplicateOf)
        : 0,
    visibleFeatures: Array.isArray(
      value.visibleFeatures
    )
      ? value.visibleFeatures.filter(
          (item): item is string =>
            typeof item === "string"
        )
      : [],
    includeRecommendation:
      value.includeRecommendation !== false,
    reason:
      typeof value.reason === "string"
        ? value.reason
        : "Analyzed by WalkNWow vision.",
  };
}
