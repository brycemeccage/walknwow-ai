import { runQualityDirector } from "../quality/quality-director";

export type QualityInput = {
  clipId: string;
  camera: number;
  life: number;
  fidelity: number;
  sharpness: number;
  luxury: number;
  consistency: number;
  flags?: {
    floating?: boolean;
    changed?: boolean;
    dead?: boolean;
    blur?: boolean;
  };
};

export function runQuality(inputs: QualityInput[]) {
  return runQualityDirector(inputs);
}
