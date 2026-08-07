"use client";

import { Card } from "../ui/Card";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export function ExportPanel({
  preset,
  onPresetChange,
  onExport,
}: {
  preset: string;
  onPresetChange: (preset: string) => void;
  onExport: () => void;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold">Export</p>
      <p className="mt-1 text-xs text-white/40">
        Final delivery settings.
      </p>

      <div className="mt-4 space-y-3">
        <Select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
        >
          <option value="express">Express · 720p</option>
          <option value="standard">Standard · 1080p</option>
          <option value="luxury">Luxury · 2K</option>
          <option value="ultra">Ultra · 4K</option>
        </Select>

        <Button fullWidth onClick={onExport}>
          Export Walkthrough
        </Button>
      </div>
    </Card>
  );
}
