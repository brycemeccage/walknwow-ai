import { Card } from "../ui/Card";
import { Progress } from "../ui/Progress";
import { Badge } from "../ui/Badge";
import type { ProductionStage } from "./dashboard-types";

export function ProgressTracker({
  stages,
}: {
  stages: ProductionStage[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Production Progress</p>
          <p className="mt-1 text-xs text-white/40">
            Live production pipeline
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="rounded-xl border border-white/10 bg-black/25 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/75">
                {stage.label}
              </span>
              <Badge
                tone={
                  stage.status === "complete"
                    ? "green"
                    : stage.status === "running"
                      ? "cyan"
                      : stage.status === "error"
                        ? "red"
                        : "neutral"
                }
              >
                {stage.status}
              </Badge>
            </div>
            <Progress value={stage.progress} />
          </div>
        ))}
      </div>
    </Card>
  );
}
