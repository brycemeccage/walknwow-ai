import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "cyan" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-white/60",
    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    green: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    red: "border-red-300/20 bg-red-300/10 text-red-100",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
