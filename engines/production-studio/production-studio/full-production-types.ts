import type { Photo } from "../director/director-types";
import type { EditScene } from "../editing";
import type { RealtorBranding } from "../branding";
import type { ExportAspect, ExportPreset } from "../export";
import type { RenderPlan } from "../rendering";

export type FullProductionInput = {
  jobId: string;
  listingUrl: string;
  photos: Photo[];
  generatedClips: Array<{
    photoNumber: number;
    videoUrl: string;
    roomLabel?: string;
    category?: string;
    qualityScore?: number;
    storytellingScore?: number;
  }>;
  propertyType?: string;
  standoutFeatures?: string[];
  branding?: RealtorBranding;
  exportPreset?: ExportPreset;
  exportAspect?: ExportAspect;
};

export type FullProductionResult = {
  success: boolean;
  jobId: string;
  listingUrl: string;
  selectedPhotoNumbers: number[];
  heroPhotoNumbers: number[];
  editScenes: EditScene[];
  renderPlan: RenderPlan;
};
