export type MusicMix = {
  musicVolume: number;
  originalAudioVolume: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
};

export const DEFAULT_MUSIC_MIX: MusicMix = {
  musicVolume: 0.16,
  originalAudioVolume: 0,
  fadeInSeconds: 0.8,
  fadeOutSeconds: 1.2,
};

export function normalizeMusicMix(
  value?: Partial<MusicMix>
): MusicMix {
  return {
    musicVolume:
      typeof value?.musicVolume === "number"
        ? Math.max(
            0,
            Math.min(1, value.musicVolume)
          )
        : DEFAULT_MUSIC_MIX.musicVolume,
    originalAudioVolume:
      typeof value?.originalAudioVolume === "number"
        ? Math.max(
            0,
            Math.min(
              1,
              value.originalAudioVolume
            )
          )
        : DEFAULT_MUSIC_MIX.originalAudioVolume,
    fadeInSeconds:
      typeof value?.fadeInSeconds === "number"
        ? Math.max(0, value.fadeInSeconds)
        : DEFAULT_MUSIC_MIX.fadeInSeconds,
    fadeOutSeconds:
      typeof value?.fadeOutSeconds === "number"
        ? Math.max(0, value.fadeOutSeconds)
        : DEFAULT_MUSIC_MIX.fadeOutSeconds,
  };
}
