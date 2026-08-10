"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ExtractResponse = {
  success: boolean;
  message?: string;
  images?: string[];
  pageTitle?: string;
};

export default function ProjectPhotoStep({
  projectId,
  listingUrl,
}: {
  projectId: string;
  listingUrl: string;
}) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/walkthroughs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        const data = (await response.json()) as ExtractResponse;

        if (!response.ok || !data.success || !Array.isArray(data.images)) {
          throw new Error(data.message || "Could not load listing photos.");
        }

        if (cancelled) return;

        setPhotos(data.images);
        setSelected(data.images);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load listing photos."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (listingUrl) {
      loadPhotos();
    } else {
      setError("This project does not have a listing URL.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [listingUrl]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(url: string) {
    setSelected((current) =>
      current.includes(url)
        ? current.filter((item) => item !== url)
        : [...current, url]
    );
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
        Step 2 of 4
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
        Pick your favorite photos.
      </h2>

      <p className="mt-3 text-slate-500">
        Tap any photo to include or remove it. We selected them all to start.
      </p>

      {loading && (
        <div className="mt-7 rounded-2xl bg-cyan-50 p-10 text-center">
          <div className="text-3xl">🏡</div>
          <p className="mt-4 text-lg font-black">Finding your property photos…</p>
          <p className="mt-2 text-sm text-slate-500">
            This can take a moment.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">We couldn&apos;t load the photos.</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="font-black">
              {selected.length} of {photos.length} selected
            </p>

            <button
              type="button"
              onClick={() =>
                setSelected(
                  selected.length === photos.length ? [] : [...photos]
                )
              }
              className="text-sm font-black text-cyan-600"
            >
              {selected.length === photos.length ? "Clear all" : "Select all"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((url, index) => {
              const checked = selectedSet.has(url);

              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => toggle(url)}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border-4 transition ${
                    checked
                      ? "border-cyan-400"
                      : "border-transparent opacity-45"
                  }`}
                >
                  {/* External listing URLs vary, so regular img is intentional here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Property photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  <span
                    className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow ${
                      checked
                        ? "bg-cyan-400 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {checked ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-700"
        >
          ← Back
        </Link>

        <Link
          href={`/projects/${projectId}?step=create`}
          aria-disabled={selected.length === 0}
          className={`inline-flex justify-center rounded-2xl px-6 py-4 font-black text-white ${
            selected.length
              ? "bg-cyan-500 hover:bg-cyan-600"
              : "pointer-events-none bg-slate-300"
          }`}
        >
          Continue with {selected.length} Photos →
        </Link>
      </div>
    </section>
  );
}
