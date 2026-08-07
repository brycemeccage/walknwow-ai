import { runDirector } from "../director/director-engine";
import { runStoryEngine } from "../story/story-engine";
import type { Photo } from "../director/director-types";

export function runBrain(photos: Photo[]) {
  const director = runDirector(photos);
  const story = runStoryEngine(director.selected);

  return {
    selectedPhotoNumbers: director.selected,
    heroPhotoNumbers: director.hero,
    storyScenes: story,
  };
}
