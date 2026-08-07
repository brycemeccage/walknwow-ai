export type PhotoScoreInput = {
  qualityScore: number;
  storytellingScore: number;
  animationSuitabilityScore: number;
  distortionRisk: "low" | "medium" | "high";
  blurRisk: "low" | "medium" | "high";
  duplicateOf: number;
};

export function scorePhoto(
  input: PhotoScoreInput
): number {
  const distortionPenalty =
    input.distortionRisk === "high"
      ? 18
      : input.distortionRisk === "medium"
        ? 8
        : 0;

  const blurPenalty =
    input.blurRisk === "high"
      ? 20
      : input.blurRisk === "medium"
        ? 8
        : 0;

  const duplicatePenalty =
    input.duplicateOf > 0 ? 50 : 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        input.qualityScore * 0.35 +
          input.storytellingScore * 0.4 +
          input.animationSuitabilityScore * 0.25 -
          distortionPenalty -
          blurPenalty -
          duplicatePenalty
      )
    )
  );
}

export function shouldIncludePhoto(
  score: number,
  duplicateOf: number
): boolean {
  return duplicateOf === 0 && score >= 45;
}
