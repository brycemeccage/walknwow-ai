import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { DashboardClip } from "./dashboard-types";

export function ClipQueue({
  clips,
}: {
  clips: DashboardClip[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold">Generation Queue</p>
        <p className="mt-1 text-xs text-white/40">
          Quality Director automatically retries weak scenes.
        </p>
      </div>

      <div className="space-y-2">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3"
          >
            <div>
              <p className="text-sm font-medium">{clip.roomLabel}</p>
              <p className="mt-1 text-xs text-white/35">
                Photo {clip.photoNumber}
                {typeof clip.score === "number"
                  ? ` · Score ${clip.score.toFixed(1)}`
                  : ""}
              </p>
            </div>
            <Badge
              tone={
                clip.status === "accepted"
                  ? "green"
                  : clip.status === "failed"
                    ? "red"
                    : clip.status === "retrying"
                      ? "amber"
                      : clip.status === "generating" ||
                          clip.status === "reviewing"
                        ? "cyan"
                        : "neutral"
              }
            >
              {clip.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
