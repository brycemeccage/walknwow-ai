export function Progress({
  value,
}: {
  value: number;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200 transition-all duration-500"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
