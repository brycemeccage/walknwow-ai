export type QualityScores = {
  sharpnessScore: number;
  architectureScore: number;
  geometryScore: number;
  continuityScore: number;
  motionScore: number;
  flickerScore: number;
};

export function calculateOverallQuality(
  scores: QualityScores
): number {
  return Math.round(
    scores.sharpnessScore * 0.22 +
      scores.architectureScore * 0.24 +
      scores.geometryScore * 0.18 +
      scores.continuityScore * 0.16 +
      scores.motionScore * 0.12 +
      scores.flickerScore * 0.08
  );
}

export function shouldRejectQuality(args: {
  overallScore: number;
  openingBlurDetected: boolean;
  architectureChanged: boolean;
  geometryWarpDetected: boolean;
  furnitureOrFixtureChanged: boolean;
}): boolean {
  return (
    args.overallScore < 82 ||
    args.openingBlurDetected ||
    args.architectureChanged ||
    args.geometryWarpDetected ||
    args.furnitureOrFixtureChanged
  );
}
