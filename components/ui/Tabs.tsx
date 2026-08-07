"use client";

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => onChange(item)}
          className={[
            "rounded-lg px-3 py-2 text-xs font-semibold transition",
            value === item
              ? "bg-white text-black"
              : "text-white/50 hover:text-white",
          ].join(" ")}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
