import { Card } from "../ui/Card";

export function CostTracker({
  credits,
  estimatedCost,
  etaMinutes,
}: {
  credits: number;
  estimatedCost: number;
  etaMinutes: number;
}) {
  const items = [
    ["Credits Used", credits.toLocaleString()],
    ["Estimated Cost", `$${estimatedCost.toFixed(2)}`],
    ["ETA", `${etaMinutes} min`],
  ];

  return (
    <Card className="grid grid-cols-3 divide-x divide-white/10 p-4">
      {items.map(([label, value]) => (
        <div key={label} className="px-3 text-center">
          <p className="text-[11px] text-white/35">{label}</p>
          <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
      ))}
    </Card>
  );
}
