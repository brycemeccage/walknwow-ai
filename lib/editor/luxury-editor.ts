export type SceneCategory =
  | "front_exterior"
  | "rear_exterior"
  | "aerial"
  | "entry"
  | "foyer"
  | "living_room"
  | "family_room"
  | "kitchen"
  | "dining_room"
  | "office"
  | "primary_bedroom"
  | "bedroom"
  | "primary_bathroom"
  | "bathroom"
  | "stairs"
  | "hallway"
  | "garage"
  | "basement"
  | "gym"
  | "theater"
  | "game_room"
  | "patio_deck"
  | "backyard"
  | "pool"
  | "dock"
  | "view"
  | "other";

export type SceneImportance =
  | "hero"
  | "standard"
  | "supporting";

export type LuxuryEditorScene = {
  id: string;
  photoNumber?: number;
  category: SceneCategory | string;
  roomLabel?: string;
  importance?: SceneImportance;
  videoUrl: string;
  qualityScore?: number;
  storytellingScore?: number;
  similarityGroup?: string;
};

export type EditedScene = LuxuryEditorScene & {
  order: number;
  durationSeconds: number;
  transitionSeconds: number;
  transitionType: "fade";
  removed: boolean;
  removalReason?: string;
};

export type LuxuryEditorTimeline = {
  scenes: EditedScene[];
  activeScenes: EditedScene[];
  removedScenes: EditedScene[];
  openingFadeSeconds: number;
  endingFadeSeconds: number;
  defaultCrossfadeSeconds: number;
  estimatedRuntimeSeconds: number;
};

const OPENING_FADE_SECONDS = 1.5;
const ENDING_FADE_SECONDS = 2;
const DEFAULT_CROSSFADE_SECONDS = 0.7;

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(min, Math.min(max, value));
}

function score(
  value: unknown,
  fallback = 70
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? clamp(value, 0, 100)
    : fallback;
}

function categoryGroup(
  category: string
):
  | "hero"
  | "bathroom"
  | "bedroom"
  | "standard" {
  if (
    [
      "front_exterior",
      "rear_exterior",
      "aerial",
      "pool",
      "dock",
      "view",
      "backyard",
      "patio_deck",
    ].includes(category)
  ) {
    return "hero";
  }

  if (
    [
      "primary_bathroom",
      "bathroom",
    ].includes(category)
  ) {
    return "bathroom";
  }

  if (
    [
      "primary_bedroom",
      "bedroom",
    ].includes(category)
  ) {
    return "bedroom";
  }

  return "standard";
}

function durationForScene(
  scene: LuxuryEditorScene
): number {
  const group =
    categoryGroup(scene.category);

  const combinedScore =
    (
      score(scene.qualityScore) +
      score(
        scene.storytellingScore
      )
    ) / 2;

  if (
    scene.importance === "hero" ||
    group === "hero"
  ) {
    return Number(
      clamp(
        3.8 +
          ((combinedScore - 70) / 30) *
            0.4,
        3.8,
        4.2
      ).toFixed(2)
    );
  }

  if (group === "bathroom") {
    return Number(
      clamp(
        2.8 +
          ((combinedScore - 70) / 30) *
            0.2,
        2.8,
        3
      ).toFixed(2)
    );
  }

  return Number(
    clamp(
      3 +
        ((combinedScore - 70) / 30) *
          0.4,
      3,
      3.4
    ).toFixed(2)
  );
}

function areSimilar(
  left: LuxuryEditorScene,
  right: LuxuryEditorScene
): boolean {
  if (
    left.similarityGroup &&
    right.similarityGroup &&
    left.similarityGroup ===
      right.similarityGroup
  ) {
    return true;
  }

  if (
    left.category === right.category
  ) {
    return true;
  }

  const leftGroup =
    categoryGroup(left.category);

  const rightGroup =
    categoryGroup(right.category);

  return (
    leftGroup === rightGroup &&
    (
      leftGroup === "bedroom" ||
      leftGroup === "bathroom"
    )
  );
}

function strength(
  scene: LuxuryEditorScene
): number {
  return (
    score(scene.qualityScore) * 0.55 +
    score(
      scene.storytellingScore
    ) * 0.45
  );
}

function shouldSeparate(
  left: LuxuryEditorScene,
  right: LuxuryEditorScene
): boolean {
  const leftGroup =
    categoryGroup(left.category);

  const rightGroup =
    categoryGroup(right.category);

  return (
    leftGroup === rightGroup &&
    (
      leftGroup === "bedroom" ||
      leftGroup === "bathroom"
    )
  );
}

function reorderScenes(
  scenes: LuxuryEditorScene[]
): LuxuryEditorScene[] {
  const remaining = [...scenes];

  if (remaining.length <= 2) {
    return remaining;
  }

  const result: LuxuryEditorScene[] = [
    remaining.shift() as LuxuryEditorScene,
  ];

  while (remaining.length > 0) {
    const previous =
      result[result.length - 1];

    let nextIndex =
      remaining.findIndex(
        (scene) =>
          !shouldSeparate(
            previous,
            scene
          )
      );

    if (nextIndex < 0) {
      nextIndex = 0;
    }

    const [next] =
      remaining.splice(
        nextIndex,
        1
      );

    result.push(next);
  }

  return result;
}

function markRedundantScenes(
  scenes: LuxuryEditorScene[]
): EditedScene[] {
  const edited: EditedScene[] =
    scenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
      durationSeconds:
        durationForScene(scene),
      transitionSeconds:
        DEFAULT_CROSSFADE_SECONDS,
      transitionType: "fade",
      removed: false,
    }));

  for (
    let index = 1;
    index < edited.length;
    index += 1
  ) {
    const previous =
      edited[index - 1];

    const current =
      edited[index];

    if (
      previous.removed ||
      current.removed ||
      !areSimilar(
        previous,
        current
      )
    ) {
      continue;
    }

    const weaker =
      strength(previous) <=
      strength(current)
        ? previous
        : current;

    const stronger =
      weaker === previous
        ? current
        : previous;

    const scoreGap =
      strength(stronger) -
      strength(weaker);

    if (scoreGap >= 8) {
      weaker.removed = true;
      weaker.removalReason =
        "Removed as the weaker of two materially similar consecutive scenes.";
    } else {
      weaker.durationSeconds =
        Number(
          Math.max(
            2.6,
            weaker.durationSeconds -
              0.35
          ).toFixed(2)
        );
    }
  }

  return edited;
}

function runtimeForScenes(
  scenes: EditedScene[]
): number {
  if (scenes.length === 0) {
    return 0;
  }

  const clipTime =
    scenes.reduce(
      (total, scene) =>
        total +
        scene.durationSeconds,
      0
    );

  const transitionTime =
    Math.max(
      0,
      scenes.length - 1
    ) *
    DEFAULT_CROSSFADE_SECONDS;

  return Number(
    (
      OPENING_FADE_SECONDS +
      clipTime -
      transitionTime +
      ENDING_FADE_SECONDS
    ).toFixed(2)
  );
}

export function buildLuxuryTimeline(
  scenes: LuxuryEditorScene[]
): LuxuryEditorTimeline {
  const validScenes =
    scenes.filter(
      (scene) =>
        typeof scene.videoUrl ===
          "string" &&
        scene.videoUrl.trim().length >
          0
    );

  const reordered =
    reorderScenes(validScenes);

  const edited =
    markRedundantScenes(
      reordered
    );

  const activeScenes =
    edited
      .filter(
        (scene) =>
          !scene.removed
      )
      .map((scene, index) => ({
        ...scene,
        order: index + 1,
        transitionSeconds:
          index === 0
            ? 0
            : DEFAULT_CROSSFADE_SECONDS,
      }));

  const removedScenes =
    edited.filter(
      (scene) =>
        scene.removed
    );

  return {
    scenes: edited,
    activeScenes,
    removedScenes,
    openingFadeSeconds:
      OPENING_FADE_SECONDS,
    endingFadeSeconds:
      ENDING_FADE_SECONDS,
    defaultCrossfadeSeconds:
      DEFAULT_CROSSFADE_SECONDS,
    estimatedRuntimeSeconds:
      runtimeForScenes(
        activeScenes
      ),
  };
}

export function getLuxuryEditorDefaults() {
  return {
    openingFadeSeconds:
      OPENING_FADE_SECONDS,
    endingFadeSeconds:
      ENDING_FADE_SECONDS,
    defaultCrossfadeSeconds:
      DEFAULT_CROSSFADE_SECONDS,
    heroDurationRange: [
      3.8,
      4.2,
    ] as const,
    standardDurationRange: [
      3,
      3.4,
    ] as const,
    bathroomDurationRange: [
      2.8,
      3,
    ] as const,
  };
}