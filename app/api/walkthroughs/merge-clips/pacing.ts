export type PacingMode =
  | "fast"
  | "balanced"
  | "luxury";

export function sceneDurationForMode(
  baseDuration: number,
  mode: PacingMode
): number {
  if (mode === "fast") {
    return Math.max(
      2.5,
      Math.min(3.2, baseDuration)
    );
  }

  if (mode === "luxury") {
    return Math.max(
      3.5,
      Math.min(5, baseDuration)
    );
  }

  return Math.max(
    3,
    Math.min(4, baseDuration)
  );
}

export function estimateWalkthroughRuntime(
  sceneDurations: number[],
  transitionSeconds = 0.22
): number {
  if (sceneDurations.length === 0) {
    return 0;
  }

  const scenes = sceneDurations.reduce(
    (total, duration) =>
      total + duration,
    0
  );

  const overlap =
    Math.max(
      0,
      sceneDurations.length - 1
    ) * transitionSeconds;

  return Math.max(0, scenes - overlap);
}
