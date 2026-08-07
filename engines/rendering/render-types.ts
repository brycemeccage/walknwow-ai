import type {
  EditTimeline,
} from "../editing";
import type {
  MusicProfile,
} from "../music";
import type {
  OutroPlan,
} from "../branding";
import type {
  ExportPlan,
} from "../export";

export type RenderPlan = {
  version: "walknwow-render-v2";
  timeline: EditTimeline;
  music: MusicProfile;
  outro?: OutroPlan;
  export: ExportPlan;
  totalDurationSeconds: number;
};
