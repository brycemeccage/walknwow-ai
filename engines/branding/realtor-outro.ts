import type {
  OutroPlan,
  RealtorBranding,
} from "./branding-types";

export function buildRealtorOutro(
  branding: RealtorBranding
): OutroPlan {
  return {
    durationSeconds: 6,
    fadeInSeconds: 1,
    fadeOutSeconds: 1,
    branding: {
      ...branding,
      callToAction:
        branding.callToAction ??
        "Schedule Your Private Tour",
    },
  };
}
