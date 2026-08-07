import { Card } from "../ui/Card";

export function VideoPreview({
  videoUrl,
}: {
  videoUrl?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-semibold">Final Preview</p>
      </div>

      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          playsInline
          className="aspect-video w-full bg-black object-contain"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-black">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-full border border-cyan-300/20 bg-cyan-300/10" />
            <p className="mt-4 text-sm font-medium text-white/55">
              Your finished walkthrough will appear here.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
