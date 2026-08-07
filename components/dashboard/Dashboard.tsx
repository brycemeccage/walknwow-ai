"use client";

import { useState } from "react";
import { ProgressTracker } from "./ProgressTracker";
import { PropertySummary } from "./PropertySummary";
import { PhotoSelector } from "./PhotoSelector";
import { ClipQueue } from "./ClipQueue";
import { QualityPanel } from "./QualityPanel";
import { MusicPanel } from "./MusicPanel";
import { BrandingPanel, type BrandingForm } from "./BrandingPanel";
import { ExportPanel } from "./ExportPanel";
import { VideoPreview } from "./VideoPreview";
import { CostTracker } from "./CostTracker";
import type {
  DashboardClip,
  DashboardPhoto,
  ProductionStage,
} from "./dashboard-types";

const initialStages: ProductionStage[] = [
  { key: "analyze", label: "Analyze", status: "complete", progress: 100 },
  { key: "select", label: "Select", status: "complete", progress: 100 },
  { key: "generate", label: "Generate", status: "running", progress: 45 },
  { key: "retry", label: "Retry", status: "waiting", progress: 0 },
  { key: "edit", label: "Edit", status: "waiting", progress: 0 },
  { key: "music", label: "Music", status: "waiting", progress: 0 },
  { key: "brand", label: "Brand", status: "waiting", progress: 0 },
  { key: "export", label: "Export", status: "waiting", progress: 0 },
];

const demoPhotos: DashboardPhoto[] = Array.from({ length: 12 }, (_, index) => ({
  photoNumber: index + 1,
  imageUrl: `https://picsum.photos/seed/walknwow-${index + 1}/800/600`,
  roomLabel:
    [
      "Front Exterior",
      "Living Room",
      "Kitchen",
      "Dining Room",
      "Primary Bedroom",
      "Primary Bathroom",
      "Bedroom",
      "Bathroom",
      "Backyard",
      "Pool",
      "Dock",
      "View",
    ][index] ?? `Photo ${index + 1}`,
  selected: index < 8,
  score: 88 + (index % 8),
}));

const demoClips: DashboardClip[] = demoPhotos
  .filter((photo) => photo.selected)
  .map((photo, index) => ({
    id: `clip-${photo.photoNumber}`,
    photoNumber: photo.photoNumber,
    roomLabel: photo.roomLabel,
    score: index < 3 ? 9.4 - index * 0.2 : undefined,
    status:
      index < 3
        ? "accepted"
        : index === 3
          ? "reviewing"
          : index === 4
            ? "generating"
            : "queued",
  }));

export function Dashboard() {
  const [photos, setPhotos] = useState(demoPhotos);
  const [musicStyle, setMusicStyle] = useState("luxury");
  const [exportPreset, setExportPreset] = useState("luxury");
  const [branding, setBranding] = useState<BrandingForm>({
    realtorName: "",
    phone: "",
    email: "",
    website: "",
    brokerage: "",
  });

  const selectedCount = photos.filter((photo) => photo.selected).length;

  function togglePhoto(photoNumber: number) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.photoNumber === photoNumber
          ? { ...photo, selected: !photo.selected }
          : photo
      )
    );
  }

  return (
    <div className="space-y-6">
      <PropertySummary
        address="123 Luxury Lake Drive"
        summary="AI Director selected the strongest story-building property angles and is generating a consistent luxury walkthrough."
        selectedCount={selectedCount}
        totalPhotos={photos.length}
      />

      <ProgressTracker stages={initialStages} />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
        <div className="space-y-6">
          <VideoPreview />
          <PhotoSelector photos={photos} onToggle={togglePhoto} />
        </div>

        <div className="space-y-6">
          <CostTracker credits={312} estimatedCost={28.4} etaMinutes={7} />
          <ClipQueue clips={demoClips} />
          <QualityPanel
            scores={{
              Camera: 9.3,
              Life: 8.9,
              Fidelity: 9.6,
              Sharpness: 9.2,
              Luxury: 9.1,
              Consistency: 8.8,
            }}
          />
          <MusicPanel style={musicStyle} onChange={setMusicStyle} />
          <BrandingPanel value={branding} onChange={setBranding} />
          <ExportPanel
            preset={exportPreset}
            onPresetChange={setExportPreset}
            onExport={() => {
              console.log("Export requested", {
                musicStyle,
                exportPreset,
                branding,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
