import type {
  EditScene,
  EditedScene,
  EditTimeline,
} from "./editing-types";

const CROSSFADE_SECONDS = 0.7;
const OPENING_FADE_SECONDS = 1.5;
const ENDING_FADE_SECONDS = 2;

function durationForScene(scene: EditScene): number {
  if (scene.hero) return 4;

  if (
    scene.category === "bathroom" ||
    scene.category === "primary_bathroom"
  ) {
    return 2.9;
  }

  return 3.2;
}

export function buildLuxuryTimeline(
  inputScenes: EditScene[]
): EditTimeline {
  const scenes: EditedScene[] =
    inputScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
      durationSeconds:
        durationForScene(scene),
      transitionSeconds:
        index === 0
          ? 0
          : CROSSFADE_SECONDS,
    }));

  const rawRuntime =
    scenes.reduce(
      (total, scene) =>
        total + scene.durationSeconds,
      0
    );

  const transitionTime =
    Math.max(0, scenes.length - 1) *
    CROSSFADE_SECONDS;

  return {
    scenes,
    openingFadeSeconds:
      OPENING_FADE_SECONDS,
    endingFadeSeconds:
      ENDING_FADE_SECONDS,
    crossfadeSeconds:
      CROSSFADE_SECONDS,
    estimatedRuntimeSeconds:
      Number(
        (
          rawRuntime -
          transitionTime +
          OPENING_FADE_SECONDS +
          ENDING_FADE_SECONDS
        ).toFixed(2)
      ),
  };
}
