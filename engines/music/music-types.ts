export type MusicStyle =
  | "luxury"
  | "modern"
  | "waterfront"
  | "cabin"
  | "urban"
  | "family";

export type MusicProfile = {
  style: MusicStyle;
  bpm: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  baseVolume: number;
  outroVolume: number;
  beatsPerBar: number;
  phraseBars: number;
};
