"use client";

import { Card } from "../ui/Card";
import { Select } from "../ui/Select";

export function MusicPanel({
  style,
  onChange,
}: {
  style: string;
  onChange: (style: string) => void;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold">Music Director</p>
      <p className="mt-1 text-xs text-white/40">
        Automatically synced to the final edit.
      </p>

      <div className="mt-4">
        <Select value={style} onChange={(e) => onChange(e.target.value)}>
          <option value="luxury">Luxury Ambient</option>
          <option value="modern">Modern</option>
          <option value="waterfront">Waterfront</option>
          <option value="cabin">Warm Acoustic</option>
          <option value="urban">Urban Electronic</option>
          <option value="family">Family Lifestyle</option>
        </Select>
      </div>
    </Card>
  );
}
