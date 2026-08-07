export type BlurAssessment = {
  openingBlurDetected: boolean;
  sharpnessScore: number;
  reason: string;
};

export function assessBlurFromScores(
  openingSharpness: number,
  middleSharpness: number
): BlurAssessment {
  const opening = Math.max(
    0,
    Math.min(100, openingSharpness)
  );
  const middle = Math.max(
    0,
    Math.min(100, middleSharpness)
  );

  const openingBlurDetected =
    opening < 72 ||
    middle - opening > 12;

  return {
    openingBlurDetected,
    sharpnessScore: Math.round(
      opening * 0.65 + middle * 0.35
    ),
    reason: openingBlurDetected
      ? "Opening frame is too soft or visibly settles into focus."
      : "Opening frame is acceptably sharp.",
  };
}
