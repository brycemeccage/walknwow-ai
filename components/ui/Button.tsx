"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
};

const styles = {
  primary:
    "bg-cyan-300 text-black hover:bg-cyan-200 border border-cyan-200",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost:
    "bg-transparent text-white/70 hover:bg-white/5 border border-white/10",
  danger:
    "bg-red-500/15 text-red-100 hover:bg-red-500/20 border border-red-400/20",
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
