import type {
  ExportAspect,
  ExportPlan,
  ExportPreset,
} from "./export-types";

const PRESETS = {
  express: {
    width: 1280,
    height: 720,
    bitrate: 6,
  },
  standard: {
    width: 1920,
    height: 1080,
    bitrate: 12,
  },
  luxury: {
    width: 2560,
    height: 1440,
    bitrate: 20,
  },
  ultra: {
    width: 3840,
    height: 2160,
    bitrate: 36,
  },
} as const;

export function buildExportPlan(
  preset: ExportPreset = "luxury",
  aspect: ExportAspect = "16:9"
): ExportPlan {
  const base = PRESETS[preset];

  let width = base.width;
  let height = base.height;

  if (aspect === "9:16") {
    width = base.height;
    height = base.width;
  }

  if (aspect === "1:1") {
    width = base.height;
    height = base.height;
  }

  return {
    preset,
    aspect,
    width,
    height,
    fps: 30,
    codec: "h264",
    videoBitrateMbps:
      base.bitrate,
    audioBitrateKbps: 192,
  };
}
