import type {
  ProductionInput,
  ProductionStudioOutput,
} from "./integration-types";
import { runProductionPipeline } from "./production-pipeline";

export class WalkNWowProductionStudio {
  async run(
    input: ProductionInput,
    onProgress?: (progress: number, message: string) => void
  ): Promise<ProductionStudioOutput> {
    return await runProductionPipeline(input, onProgress);
  }
}

export const productionStudio = new WalkNWowProductionStudio();
