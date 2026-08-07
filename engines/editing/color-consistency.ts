export type ColorProfile = {
  exposure: number;
  contrast: number;
  saturation: number;
  warmth: number;
};

export function normalizeColorProfile(
  input?: Partial<ColorProfile>
): ColorProfile {
  return {
    exposure:
      input?.exposure ?? 0,
    contrast:
      input?.contrast ?? 1,
    saturation:
      input?.saturation ?? 1,
    warmth:
      input?.warmth ?? 0,
  };
}

export function buildColorFilter(
  profile: ColorProfile
): string {
  const brightness =
    Math.max(
      -0.2,
      Math.min(
        0.2,
        profile.exposure / 5
      )
    );

  return [
    `eq=brightness=${brightness.toFixed(3)}`,
    `contrast=${profile.contrast.toFixed(3)}`,
    `saturation=${profile.saturation.toFixed(3)}`,
  ].join(":");
}
