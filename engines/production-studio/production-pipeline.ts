import type {
  ProductionInput,
  ProductionStudioOutput,
} from "./integration-types";
import { ProductionContext } from "./pipeline-context";
import { runBrain } from "./brain-adapter";
import { runQuality } from "./quality-adapter";
import { qualityInputsFromPhotos } from "./default-quality";
import { moveToStage } from "./stage-manager";
import { ProgressManager } from "./progress-manager";
import { ProductionLogger } from "./logger";
import { productionError } from "./error-handler";

export async function runProductionPipeline(
  input: ProductionInput,
  onProgress?: (progress: number, message: string) => void
): Promise<ProductionStudioOutput> {
  const context = new ProductionContext(input);
  const progress = new ProgressManager(context.state);
  const logger = new ProductionLogger(`WalkNWow:${input.jobId}`);

  if (onProgress) {
    progress.subscribe((state) => {
      onProgress(state.progress, state.message);
    });
  }

  try {
    context.state = moveToStage(
      context.state,
      "directing",
      "Analyzing and selecting the strongest property photos."
    );
    progress.update(context.state);

    const brain = runBrain(input.photos);
    context.set("brain", brain);

    context.state = moveToStage(
      context.state,
      "story",
      "Building the property story and scene order."
    );
    progress.update(context.state);

    context.state = moveToStage(
      context.state,
      "quality",
      "Scoring selected scenes for consistency and quality."
    );
    progress.update(context.state);

    const qualityInputs = qualityInputsFromPhotos(
      input.photos,
      brain.selectedPhotoNumbers
    );

    const quality = runQuality(qualityInputs);

    context.state = moveToStage(
      context.state,
      "complete",
      "Production brain complete."
    );
    progress.update(context.state);

    return {
      success: true,
      jobId: input.jobId,
      listingUrl: input.listingUrl,
      brain: {
        selectedPhotoNumbers: brain.selectedPhotoNumbers,
        heroPhotoNumbers: brain.heroPhotoNumbers,
        storyScenes: brain.storyScenes,
        qualityReports: quality.reports,
        walkthroughScore: quality.walkthroughScore,
      },
    };
  } catch (error) {
    const normalized = productionError(error);
    logger.error("Production pipeline failed.", normalized);

    context.state = moveToStage(
      context.state,
      "failed",
      normalized.message
    );
    progress.update(context.state);

    throw normalized;
  }
}
