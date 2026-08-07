import {
  getCameraProfile,
  type CameraProfile,
} from "./camera-profiles";
import {
  getLensProfile,
  type LensProfile,
} from "./lens-profiles";
import {
  getMovementProfile,
  type MovementProfile,
} from "./movement-profiles";
import {
  getRoomProfile,
  type RoomProfile,
} from "./room-profiles";

export type CinematographyProfile = {
  category: string;
  room: RoomProfile;
  camera: CameraProfile;
  lens: LensProfile;
  movement: MovementProfile;
  durationSeconds: number;
  motionBudget: number;
  qualityRisk: "low" | "medium" | "high";
};

export function mapCategoryToCinematography(
  category: string
): CinematographyProfile {
  const room = getRoomProfile(category);
  const camera = getCameraProfile(category);
  const lens = getLensProfile(room.lens);
  const movement = getMovementProfile(room.movement);

  return {
    category,
    room,
    camera,
    lens,
    movement,
    durationSeconds: Math.min(
      room.durationSeconds,
      camera.durationSeconds
    ),
    motionBudget: Math.min(
      movement.maxMotion,
      camera.motionBudget
    ),
    qualityRisk:
      room.qualityRisk === "high" ||
      camera.qualityRisk === "high"
        ? "high"
        : room.qualityRisk === "medium" ||
            camera.qualityRisk === "medium"
          ? "medium"
          : "low",
  };
}
