export function Loading({
  label = "Working...",
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/55">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
      {label}
    </div>
  );
}
