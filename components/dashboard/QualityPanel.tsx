import { Card } from "../ui/Card";
import { Progress } from "../ui/Progress";

const METRICS = [
  "Camera",
  "Life",
  "Fidelity",
  "Sharpness",
  "Luxury",
  "Consistency",
];

export function QualityPanel({
  scores,
}: {
  scores: Record<string, number>;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold">Quality Director</p>
      <p className="mt-1 text-xs text-white/40">
        Final video should feel like one professional shoot.
      </p>

      <div className="mt-5 space-y-4">
        {METRICS.map((metric) => {
          const score = scores[metric] ?? 0;
          return (
            <div key={metric}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-white/55">{metric}</span>
                <span className="font-semibold text-white">
                  {score.toFixed(1)}/10
                </span>
              </div>
              <Progress value={score * 10} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
