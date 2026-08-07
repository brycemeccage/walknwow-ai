import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none",
        "placeholder:text-white/25 focus:border-cyan-300/50",
        className,
      ].join(" ")}
    />
  );
}
