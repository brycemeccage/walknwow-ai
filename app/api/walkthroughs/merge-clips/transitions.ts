export type TransitionProfile = {
  name: string;
  durationSeconds: number;
  ffmpegName: string;
};

export const SOFT_DISSOLVE: TransitionProfile = {
  name: "Soft Dissolve",
  durationSeconds: 0.22,
  ffmpegName: "fade",
};

export const GENTLE_FADE: TransitionProfile = {
  name: "Gentle Fade",
  durationSeconds: 0.3,
  ffmpegName: "fadeblack",
};

export function getTransitionForIndex(
  index: number
): TransitionProfile {
  return index === 0
    ? GENTLE_FADE
    : SOFT_DISSOLVE;
}
