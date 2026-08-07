import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export function PropertySummary({
  address,
  summary,
  selectedCount,
  totalPhotos,
}: {
  address: string;
  summary: string;
  selectedCount: number;
  totalPhotos: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge tone="cyan">Active Project</Badge>
          <h2 className="mt-3 text-2xl font-semibold">{address}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            {summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Photos" value={totalPhotos} />
          <Metric label="Selected" value={selectedCount} />
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-28 rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
