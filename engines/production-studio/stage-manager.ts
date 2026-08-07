import type { ProductionState, ProductionStage } from "./production-state";

const STAGE_PROGRESS: Record<ProductionStage, number> = {
  idle: 0,
  directing: 20,
  story: 45,
  quality: 75,
  complete: 100,
  failed: 100,
};

export function moveToStage(
  current: ProductionState,
  stage: ProductionStage,
  message: string
): ProductionState {
  return {
    ...current,
    stage,
    progress: STAGE_PROGRESS[stage],
    message,
  };
}
