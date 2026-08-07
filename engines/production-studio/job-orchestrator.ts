import type {
  ProductionInput,
  ProductionStudioOutput,
} from "./integration-types";
import { productionStudio } from "./production-engine";

export async function runProductionJob(
  input: ProductionInput
): Promise<ProductionStudioOutput> {
  return await productionStudio.run(input);
}
