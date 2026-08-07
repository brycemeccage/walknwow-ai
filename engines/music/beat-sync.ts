import type {
  MusicProfile,
} from "./music-types";

export function getPhraseLengthSeconds(
  profile: MusicProfile
): number {
  const secondsPerBeat =
    60 / profile.bpm;

  return Number(
    (
      secondsPerBeat *
      profile.beatsPerBar *
      profile.phraseBars
    ).toFixed(3)
  );
}

export function buildPhraseMarkers(
  profile: MusicProfile,
  totalDurationSeconds: number
): number[] {
  const phrase =
    getPhraseLengthSeconds(profile);

  const markers: number[] = [];

  for (
    let time = 0;
    time <= totalDurationSeconds;
    time += phrase
  ) {
    markers.push(
      Number(time.toFixed(2))
    );
  }

  return markers;
}
