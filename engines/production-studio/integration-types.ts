import type { Photo } from "../director/director-types";
import type { StoryScene } from "../story/story-types";
import type { ClipReport } from "../quality/quality-types";

export type ProductionInput = {
  jobId: string;
  listingUrl: string;
  photos: Photo[];
};

export type ProductionBrainOutput = {
  selectedPhotoNumbers: number[];
  heroPhotoNumbers: number[];
  storyScenes: StoryScene[];
  qualityReports: ClipReport[];
  walkthroughScore: number;
};

export type ProductionStudioOutput = {
  success: boolean;
  jobId: string;
  listingUrl: string;
  brain: ProductionBrainOutput;
};
