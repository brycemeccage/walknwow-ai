import type {
  FullProductionInput,
  FullProductionResult,
} from "./production-studio/full-production-types";
import { runFullProduction } from "./full-production-engine";

export type FullProductionProgress = {
  stage:
    | "directing"
    | "selecting"
    | "editing"
    | "music"
    | "branding"
    | "export"
    | "complete";
  progress: number;
  message: string;
};

export async function orchestrateFullProduction(
  input: FullProductionInput,
  onProgress?: (event: FullProductionProgress) => void
): Promise<FullProductionResult> {
  const emit = (
    stage: FullProductionProgress["stage"],
    progress: number,
    message: string
  ) => {
    onProgress?.({ stage, progress, message });
  };

  emit("directing", 10, "Reviewing property photos.");
  emit("selecting", 25, "Selecting the strongest scenes.");
  emit("editing", 50, "Building the luxury timeline.");
  emit("music", 68, "Planning music and pacing.");
  emit("branding", 82, "Preparing realtor branding.");
  emit("export", 92, "Preparing final export settings.");

  const result = await runFullProduction(input);

  emit("complete", 100, "Production plan complete.");

  return result;
}
