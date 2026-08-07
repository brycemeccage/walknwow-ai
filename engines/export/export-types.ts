export type ExportPreset =
  | "express"
  | "standard"
  | "luxury"
  | "ultra";

export type ExportAspect =
  | "16:9"
  | "9:16"
  | "1:1";

export type ExportPlan = {
  preset: ExportPreset;
  aspect: ExportAspect;
  width: number;
  height: number;
  fps: number;
  codec: "h264";
  videoBitrateMbps: number;
  audioBitrateKbps: number;
};
