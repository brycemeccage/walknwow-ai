export type ProductionStage =
  | "idle"
  | "directing"
  | "story"
  | "quality"
  | "complete"
  | "failed";

export type ProductionState = {
  stage: ProductionStage;
  progress: number;
  message: string;
};

export function createInitialProductionState(): ProductionState {
  return {
    stage: "idle",
    progress: 0,
    message: "Ready.",
  };
}
