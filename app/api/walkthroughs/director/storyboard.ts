export type StoryboardMode =
  | "fast"
  | "balanced"
  | "luxury";

export type StoryboardScene = {
  sceneNumber: number;
  photoNumber: number;
  priority: "hero" | "core" | "supporting" | "optional";
  title: string;
  purpose: string;
  cameraMove: string;
  movementAmount: "micro" | "subtle" | "moderate";
  transitionIntent: string;
  preservationRules: string[];
  estimatedDurationSeconds: number;
};

export function selectScenesByMode(
  scenes: StoryboardScene[],
  mode: StoryboardMode
): StoryboardScene[] {
  if (mode === "luxury") {
    return scenes;
  }

  if (mode === "fast") {
    return scenes.filter(
      (scene) =>
        scene.priority === "hero" ||
        scene.priority === "core"
    );
  }

  return scenes.filter(
    (scene) =>
      scene.priority !== "optional"
  );
}

export function normalizeSceneNumbers(
  scenes: StoryboardScene[]
): StoryboardScene[] {
  return scenes.map((scene, index) => ({
    ...scene,
    sceneNumber: index + 1,
  }));
}
