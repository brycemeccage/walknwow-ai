import type {
  MusicProfile,
  MusicStyle,
} from "./music-types";

function chooseStyle(
  propertyType: string,
  features: string[]
): MusicStyle {
  const text =
    `${propertyType} ${features.join(" ")}`
      .toLowerCase();

  if (
    /water|lake|ocean|dock|river|pool/.test(text)
  ) {
    return "waterfront";
  }

  if (
    /cabin|mountain|rustic|wood/.test(text)
  ) {
    return "cabin";
  }

  if (
    /condo|loft|urban|city/.test(text)
  ) {
    return "urban";
  }

  if (
    /modern|contemporary/.test(text)
  ) {
    return "modern";
  }

  if (
    /family|suburban/.test(text)
  ) {
    return "family";
  }

  return "luxury";
}

const BPM: Record<MusicStyle, number> = {
  luxury: 88,
  modern: 104,
  waterfront: 82,
  cabin: 78,
  urban: 110,
  family: 96,
};

export function buildMusicProfile(args: {
  propertyType?: string;
  features?: string[];
}): MusicProfile {
  const style =
    chooseStyle(
      args.propertyType ?? "",
      args.features ?? []
    );

  return {
    style,
    bpm: BPM[style],
    fadeInSeconds: 1.5,
    fadeOutSeconds: 2,
    baseVolume: 0.55,
    outroVolume: 0.3,
    beatsPerBar: 4,
    phraseBars: 4,
  };
}
