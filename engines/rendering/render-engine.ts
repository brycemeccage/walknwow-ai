import type {
  EditScene,
} from "../editing";
import {
  buildLuxuryTimeline,
} from "../editing";
import {
  buildMusicProfile,
} from "../music";
import {
  buildRealtorOutro,
  type RealtorBranding,
} from "../branding";
import {
  buildExportPlan,
  type ExportAspect,
  type ExportPreset,
} from "../export";
import type {
  RenderPlan,
} from "./render-types";

export function buildRenderPlan(args: {
  scenes: EditScene[];
  propertyType?: string;
  standoutFeatures?: string[];
  branding?: RealtorBranding;
  preset?: ExportPreset;
  aspect?: ExportAspect;
}): RenderPlan {
  const timeline =
    buildLuxuryTimeline(
      args.scenes
    );

  const music =
    buildMusicProfile({
      propertyType:
        args.propertyType,
      features:
        args.standoutFeatures,
    });

  const outro =
    args.branding
      ? buildRealtorOutro(
          args.branding
        )
      : undefined;

  const exportPlan =
    buildExportPlan(
      args.preset ?? "luxury",
      args.aspect ?? "16:9"
    );

  const totalDurationSeconds =
    Number(
      (
        timeline.estimatedRuntimeSeconds +
        (outro?.durationSeconds ?? 0)
      ).toFixed(2)
    );

  return {
    version:
      "walknwow-render-v2",
    timeline,
    music,
    outro,
    export:
      exportPlan,
    totalDurationSeconds,
  };
}
