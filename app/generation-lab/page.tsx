"use client";

import { useMemo, useState } from "react";

type PresetKey =
  | "locked_2s"
  | "locked_3s"
  | "environmental_2s"
  | "environmental_3s"
  | "current_production";

type RatingField =
  | "sharpness"
  | "preservation"
  | "naturalness"
  | "blur"
  | "overall";

type Preset = {
  key: PresetKey;
  label: string;
  description: string;
  durationSeconds: number;
  motionStyle:
    | "locked"
    | "environmental"
    | "production";
};

type Result = {
  preset: Preset;
  status:
    | "idle"
    | "running"
    | "complete"
    | "failed";
  videoUrl: string;
  error: string;
  runtimeSeconds: number;
  ratings: Record<RatingField, number>;
};

type ApiResponse = {
  success?: boolean;
  videoUrl?: string;
  message?: string;
};

const PRESETS: Preset[] = [
  {
    key: "locked_2s",
    label: "A — Locked 2s",
    description:
      "Locked tripod, no movement, shortest duration.",
    durationSeconds: 2,
    motionStyle: "locked",
  },
  {
    key: "locked_3s",
    label: "B — Locked 3s",
    description:
      "Locked tripod with one extra second.",
    durationSeconds: 3,
    motionStyle: "locked",
  },
  {
    key: "environmental_2s",
    label: "C — Environmental 2s",
    description:
      "Locked camera; only natural existing elements may move.",
    durationSeconds: 2,
    motionStyle: "environmental",
  },
  {
    key: "environmental_3s",
    label: "D — Environmental 3s",
    description:
      "Environmental-only motion with a longer duration.",
    durationSeconds: 3,
    motionStyle: "environmental",
  },
  {
    key: "current_production",
    label: "E — Current Production",
    description:
      "Current WalkNWow behavior used as the control.",
    durationSeconds: 4,
    motionStyle: "production",
  },
];

const RATING_FIELDS: Array<{
  key: RatingField;
  label: string;
}> = [
  { key: "sharpness", label: "Sharpness" },
  { key: "preservation", label: "Preservation" },
  { key: "naturalness", label: "Naturalness" },
  { key: "blur", label: "Blur control" },
  { key: "overall", label: "Overall" },
];

function emptyRatings(): Record<RatingField, number> {
  return {
    sharpness: 0,
    preservation: 0,
    naturalness: 0,
    blur: 0,
    overall: 0,
  };
}

function makeResults(): Result[] {
  return PRESETS.map((preset) => ({
    preset,
    status: "idle",
    videoUrl: "",
    error: "",
    runtimeSeconds: 0,
    ratings: emptyRatings(),
  }));
}

function timeLabel(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);

  return `${minutes}m ${remainder}s`;
}

export default function GenerationLabPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] =
    useState("front_exterior");
  const [results, setResults] =
    useState<Result[]>(makeResults());
  const [isRunning, setIsRunning] =
    useState(false);

  const completed = results.filter(
    (result) => result.status === "complete"
  ).length;

  const winner = useMemo(() => {
    return [...results]
      .filter(
        (result) =>
          result.status === "complete" &&
          result.ratings.overall > 0
      )
      .sort(
        (a, b) =>
          b.ratings.overall - a.ratings.overall ||
          b.ratings.sharpness - a.ratings.sharpness ||
          b.ratings.preservation -
            a.ratings.preservation
      )[0];
  }, [results]);

  function updateResult(
    key: PresetKey,
    update: (result: Result) => Result
  ) {
    setResults((current) =>
      current.map((result) =>
        result.preset.key === key
          ? update(result)
          : result
      )
    );
  }

  async function runPreset(preset: Preset) {
    const startedAt = performance.now();

    updateResult(preset.key, (result) => ({
      ...result,
      status: "running",
      videoUrl: "",
      error: "",
      runtimeSeconds: 0,
    }));

    try {
      const response = await fetch(
        "/api/walkthroughs/generation-lab",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: imageUrl.trim(),
            category,
            preset: preset.key,
            durationSeconds:
              preset.durationSeconds,
            motionStyle:
              preset.motionStyle,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.videoUrl
      ) {
        throw new Error(
          data.message || "Generation failed."
        );
      }

      updateResult(preset.key, (result) => ({
        ...result,
        status: "complete",
        videoUrl: data.videoUrl ?? "",
        runtimeSeconds:
          (performance.now() - startedAt) /
          1000,
      }));
    } catch (error) {
      updateResult(preset.key, (result) => ({
        ...result,
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Generation failed.",
        runtimeSeconds:
          (performance.now() - startedAt) /
          1000,
      }));
    }
  }

  async function runAll() {
    if (!imageUrl.trim() || isRunning) return;

    setIsRunning(true);
    setResults(makeResults());

    try {
      for (const preset of PRESETS) {
        await runPreset(preset);
      }
    } finally {
      setIsRunning(false);
    }
  }

  function setRating(
    presetKey: PresetKey,
    field: RatingField,
    value: number
  ) {
    updateResult(presetKey, (result) => ({
      ...result,
      ratings: {
        ...result.ratings,
        [field]: value,
      },
    }));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              WalkNWow Internal Tool
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              Generation Lab
            </h1>
          </div>

          <a
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Back to Studio
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
            <label>
              <span className="text-sm font-semibold">
                Source image URL
              </span>
              <input
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(
                    event.target.value
                  )
                }
                placeholder="https://..."
                disabled={isRunning}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 outline-none focus:border-cyan-300/70"
              />
            </label>

            <label>
              <span className="text-sm font-semibold">
                Category
              </span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                disabled={isRunning}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 outline-none"
              >
                <option value="front_exterior">
                  Front exterior
                </option>
                <option value="rear_exterior">
                  Rear exterior
                </option>
                <option value="backyard">
                  Backyard
                </option>
                <option value="pool">Pool</option>
                <option value="living_room">
                  Living room
                </option>
                <option value="kitchen">
                  Kitchen
                </option>
                <option value="bedroom">
                  Bedroom
                </option>
                <option value="bathroom">
                  Bathroom
                </option>
                <option value="view">View</option>
              </select>
            </label>

            <button
              type="button"
              onClick={runAll}
              disabled={
                !imageUrl.trim() ||
                isRunning
              }
              className="rounded-2xl bg-cyan-300 px-6 py-4 font-semibold text-black disabled:opacity-40"
            >
              {isRunning
                ? `Running ${completed}/5`
                : "Run 5 tests"}
            </button>
          </div>

          {imageUrl.trim() && (
            <img
              src={imageUrl.trim()}
              alt="Source"
              className="mt-6 aspect-[16/9] w-full max-w-2xl rounded-2xl border border-white/10 object-cover"
            />
          )}
        </div>

        {winner && (
          <div className="mt-6 rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.08] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
              Current winner
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {winner.preset.label}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Overall {winner.ratings.overall}/10 ·
              Sharpness{" "}
              {winner.ratings.sharpness}/10 ·
              Preservation{" "}
              {winner.ratings.preservation}/10
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {results.map((result) => (
            <article
              key={result.preset.key}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {result.preset.label}
                  </h2>
                  <p className="mt-2 text-sm text-white/50">
                    {result.preset.description}
                  </p>
                </div>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                  {result.status}
                </span>
              </div>

              <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                {result.videoUrl ? (
                  <video
                    src={result.videoUrl}
                    controls
                    loop
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/30">
                    {result.status === "running"
                      ? "Generating..."
                      : "No clip yet"}
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-4 text-xs text-white/40">
                <span>
                  Duration:{" "}
                  {result.preset.durationSeconds}s
                </span>
                <span>
                  Runtime:{" "}
                  {timeLabel(
                    result.runtimeSeconds
                  )}
                </span>
              </div>

              {result.error && (
                <p className="mt-4 rounded-xl border border-red-300/20 bg-red-300/[0.07] p-3 text-sm text-red-100">
                  {result.error}
                </p>
              )}

              {result.status === "complete" && (
                <div className="mt-5 space-y-4">
                  {RATING_FIELDS.map((field) => (
                    <div key={field.key}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">
                          {field.label}
                        </span>
                        <span>
                          {result.ratings[field.key] ||
                            "—"}
                          /10
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-10 gap-1">
                        {Array.from(
                          { length: 10 },
                          (_, index) =>
                            index + 1
                        ).map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setRating(
                                result.preset.key,
                                field.key,
                                value
                              )
                            }
                            className={`rounded-lg py-2 text-xs font-semibold ${
                              result.ratings[
                                field.key
                              ] >= value
                                ? "bg-cyan-300 text-black"
                                : "bg-white/10 text-white/50"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}