export type MovementProfileKey =
  | "ultraStatic"
  | "microPush"
  | "doorwayGlide"
  | "centeredApproach"
  | "outdoorGlide"
  | "aerialMicroGlide";

export type MovementProfile = {
  key: MovementProfileKey;
  label: string;
  instruction: string;
  maxMotion: number;
  forbid: string[];
};

export const MOVEMENT_PROFILES: Record<
  MovementProfileKey,
  MovementProfile
> = {
  ultraStatic: {
    key: "ultraStatic",
    label: "Ultra Static",
    instruction:
      "Keep the shot almost completely still with only imperceptible stabilized drift.",
    maxMotion: 0.004,
    forbid: [
      "orbiting",
      "panning",
      "tilting",
      "zooming",
      "lateral sliding",
      "perspective jumps",
    ],
  },

  microPush: {
    key: "microPush",
    label: "Micro Push",
    instruction:
      "Use a tiny, slow, centered forward micro-push with no lateral movement.",
    maxMotion: 0.01,
    forbid: [
      "orbiting",
      "spinning",
      "sweeping pans",
      "dramatic zoom",
      "camera roll",
    ],
  },

  doorwayGlide: {
    key: "doorwayGlide",
    label: "Doorway Glide",
    instruction:
      "Use a restrained, centered doorway glide with almost no perspective change.",
    maxMotion: 0.016,
    forbid: [
      "sideways drift",
      "orbiting",
      "tilting",
      "fast movement",
      "revealing unseen areas",
    ],
  },

  centeredApproach: {
    key: "centeredApproach",
    label: "Centered Approach",
    instruction:
      "Use an extremely slow centered approach with the horizon and verticals locked.",
    maxMotion: 0.025,
    forbid: [
      "rotation",
      "altitude change",
      "sweeping",
      "lateral slide",
      "perspective jump",
    ],
  },

  outdoorGlide: {
    key: "outdoorGlide",
    label: "Outdoor Glide",
    instruction:
      "Use a slow restrained forward outdoor glide with a locked horizon.",
    maxMotion: 0.02,
    forbid: [
      "horizon drift",
      "orbiting",
      "wide sweeps",
      "fast dolly movement",
      "invented scenery",
    ],
  },

  aerialMicroGlide: {
    key: "aerialMicroGlide",
    label: "Aerial Micro Glide",
    instruction:
      "Use an almost-static forward aerial micro-glide with no rotation or altitude change.",
    maxMotion: 0.02,
    forbid: [
      "yaw",
      "roll",
      "altitude change",
      "orbit",
      "terrain invention",
    ],
  },
};

export function getMovementProfile(
  key: MovementProfileKey
): MovementProfile {
  return MOVEMENT_PROFILES[key];
}
