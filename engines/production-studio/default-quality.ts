import type { Photo } from "../director/director-types";
import type { QualityInput } from "./quality-adapter";

function toTen(value: number): number {
  return Math.max(0, Math.min(10, value / 10));
}

export function qualityInputsFromPhotos(
  photos: Photo[],
  selectedPhotoNumbers: number[]
): QualityInput[] {
  const selected = new Set(selectedPhotoNumbers);

  return photos
    .filter((photo) => selected.has(photo.photoNumber))
    .map((photo) => ({
      clipId: `photo-${photo.photoNumber}`,
      camera: toTen(photo.quality),
      life: toTen(photo.story),
      fidelity: toTen(photo.quality),
      sharpness: toTen(photo.quality),
      luxury: toTen((photo.quality + photo.story) / 2),
      consistency: toTen((photo.quality + photo.story) / 2),
      flags: {
        floating: false,
        changed: false,
        dead: photo.story < 40,
        blur: photo.quality < 40,
      },
    }));
}
