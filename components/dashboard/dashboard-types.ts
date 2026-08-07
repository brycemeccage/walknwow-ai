export type StageStatus =
  | "waiting"
  | "running"
  | "complete"
  | "error";

export type ProductionStage = {
  key: string;
  label: string;
  status: StageStatus;
  progress: number;
};

export type DashboardPhoto = {
  photoNumber: number;
  imageUrl: string;
  roomLabel: string;
  selected: boolean;
  score?: number;
};

export type DashboardClip = {
  id: string;
  photoNumber: number;
  videoUrl?: string;
  roomLabel: string;
  score?: number;
  status: "queued" | "generating" | "reviewing" | "accepted" | "retrying" | "failed";
};
