import { runBrain } from "./brain-adapter";
import { clipsToEditScenes } from "./clip-adapter";
import { buildRenderPlan } from "../rendering";

import type {
  FullProductionInput,
  FullProductionResult,
} from "./production-studio/full-production-types";

export async function runFullProduction(
  input: FullProductionInput
): Promise<FullProductionResult> {
  const brain = runBrain(input.photos);

  const editScenes = clipsToEditScenes(
    input.generatedClips,
    brain.selectedPhotoNumbers,
    brain.heroPhotoNumbers
  );

  if (editScenes.length === 0) {
    throw new Error(
      "No generated clips matched the selected property photos."
    );
  }

  const renderPlan = buildRenderPlan({
    scenes: editScenes,
    propertyType: input.propertyType,
    standoutFeatures: input.standoutFeatures,
    branding: input.branding,
    preset: input.exportPreset ?? "luxury",
    aspect: input.exportAspect ?? "16:9",
  });

  return {
    success: true,
    jobId: input.jobId,
    listingUrl: input.listingUrl,
    selectedPhotoNumbers: brain.selectedPhotoNumbers,
    heroPhotoNumbers: brain.heroPhotoNumbers,
    editScenes,
    renderPlan,
  };
}
