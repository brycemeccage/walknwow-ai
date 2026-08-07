import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
