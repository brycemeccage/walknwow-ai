import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none",
        "focus:border-cyan-300/50",
        className,
      ].join(" ")}
    />
  );
}
