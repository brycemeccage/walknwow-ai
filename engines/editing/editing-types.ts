export type EditScene = {
  id: string;
  photoNumber?: number;
  category: string;
  roomLabel?: string;
  videoUrl: string;
  qualityScore?: number;
  storytellingScore?: number;
  hero?: boolean;
};

export type EditedScene = EditScene & {
  order: number;
  durationSeconds: number;
  transitionSeconds: number;
};

export type EditTimeline = {
  scenes: EditedScene[];
  openingFadeSeconds: number;
  endingFadeSeconds: number;
  crossfadeSeconds: number;
  estimatedRuntimeSeconds: number;
};
