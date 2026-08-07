"use client";

import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { DashboardPhoto } from "./dashboard-types";

export function PhotoSelector({
  photos,
  onToggle,
}: {
  photos: DashboardPhoto[];
  onToggle: (photoNumber: number) => void;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold">AI Photo Selection</p>
        <p className="mt-1 text-xs text-white/40">
          Keep only the strongest story-building angles.
        </p>
      </div>

      <div className="grid max-h-[520px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3">
        {photos.map((photo) => (
          <button
            type="button"
            onClick={() => onToggle(photo.photoNumber)}
            key={photo.photoNumber}
            className={[
              "overflow-hidden rounded-xl border text-left transition",
              photo.selected
                ? "border-cyan-300/50 bg-cyan-300/[0.06]"
                : "border-white/10 bg-white/[0.02] opacity-55",
            ].join(" ")}
          >
            <img
              src={photo.imageUrl}
              alt={`Property photo ${photo.photoNumber}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium">
                  {photo.roomLabel}
                </p>
                <Badge tone={photo.selected ? "cyan" : "neutral"}>
                  {photo.selected ? "Keep" : "Skip"}
                </Badge>
              </div>
              {typeof photo.score === "number" && (
                <p className="mt-2 text-xs text-white/35">
                  Story score {photo.score}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
