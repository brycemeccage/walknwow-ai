import type { EditScene } from "../editing";

export function clipsToEditScenes(
  clips: Array<{
    photoNumber: number;
    videoUrl: string;
    roomLabel?: string;
    category?: string;
    qualityScore?: number;
    storytellingScore?: number;
  }>,
  selectedPhotoNumbers: number[],
  heroPhotoNumbers: number[]
): EditScene[] {
  const selected = new Set(selectedPhotoNumbers);
  const heroes = new Set(heroPhotoNumbers);

  return clips
    .filter(
      (clip) =>
        selected.has(clip.photoNumber) &&
        typeof clip.videoUrl === "string" &&
        clip.videoUrl.trim().length > 0
    )
    .map((clip) => ({
      id: `clip-${clip.photoNumber}`,
      photoNumber: clip.photoNumber,
      category: clip.category ?? "other",
      roomLabel: clip.roomLabel ?? `Photo ${clip.photoNumber}`,
      videoUrl: clip.videoUrl.trim(),
      qualityScore: clip.qualityScore,
      storytellingScore: clip.storytellingScore,
      hero: heroes.has(clip.photoNumber),
    }));
}
