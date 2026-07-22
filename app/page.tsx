"use client";

import { FormEvent, useState } from "react";

type WalkthroughResponse = {
  success?: boolean;
  message?: string;
  jobId?: string;
  imageCount?: number;
  images?: string[];
};

type ClipResponse = {
  success?: boolean;
  message?: string;
  taskId?: string;
  videoUrl?: string;
};

type GeneratedClip = {
  imageUrl: string;
  videoUrl: string;
  photoNumber: number;
};

type FailedClip = {
  imageUrl: string;
  photoNumber: number;
  error: string;
};

export default function Home() {
  const [listingUrl, setListingUrl] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGeneratingClip, setIsGeneratingClip] = useState(false);
  const [generatingImageUrl, setGeneratingImageUrl] = useState("");

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>(
    []
  );
  const [failedClips, setFailedClips] = useState<FailedClip[]>([]);

  const [clipMessage, setClipMessage] = useState("");
  const [currentClipNumber, setCurrentClipNumber] = useState(0);
  const [totalClipCount, setTotalClipCount] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setImages([]);
    setClipMessage("");
    setGeneratedClips([]);
    setFailedClips([]);
    setCurrentClipNumber(0);
    setTotalClipCount(0);

    if (!listingUrl.trim()) {
      setMessage("Please paste a real estate listing link.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/walkthroughs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingUrl: listingUrl.trim(),
        }),
      });

      const data = (await response.json()) as WalkthroughResponse;

      if (!response.ok || !data.success) {
        setMessage(data.message ?? "We could not process that listing.");
        return;
      }

      const extractedImages = Array.isArray(data.images)
        ? data.images
        : [];

      setImages(extractedImages);

      setMessage(
        `Found ${
          data.imageCount ?? extractedImages.length
        } possible property photos.${
          data.jobId ? ` Job ID: ${data.jobId}` : ""
        }`
      );
    } catch (error) {
      console.error("Walkthrough request failed:", error);
      setMessage("Could not connect to the WalkNWow server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestClip(
    imageUrl: string
  ): Promise<ClipResponse> {
    const response = await fetch(
      "/api/walkthroughs/generate-clip",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
        }),
      }
    );

    const data = (await response.json()) as ClipResponse;

    if (!response.ok) {
      throw new Error(
        data.message ?? "Runway could not generate this clip."
      );
    }

    return data;
  }

  async function generateSingleClip(
    imageUrl: string,
    photoNumber: number
  ) {
    setIsGeneratingClip(true);
    setGeneratingImageUrl(imageUrl);
    setClipMessage(
      `Generating cinematic clip for photo ${photoNumber}...`
    );

    try {
      const data = await requestClip(imageUrl);

      if (!data.success || !data.videoUrl) {
        setClipMessage(
          data.message ?? "Runway could not generate this clip."
        );
        return;
      }

      const newClip: GeneratedClip = {
        imageUrl,
        videoUrl: data.videoUrl,
        photoNumber,
      };

      setGeneratedClips((currentClips) => {
        const clipsWithoutDuplicate = currentClips.filter(
          (clip) => clip.photoNumber !== photoNumber
        );

        return [...clipsWithoutDuplicate, newClip].sort(
          (a, b) => a.photoNumber - b.photoNumber
        );
      });

      setFailedClips((currentFailures) =>
        currentFailures.filter(
          (failure) => failure.photoNumber !== photoNumber
        )
      );

      setClipMessage(`Clip ${photoNumber} is ready!`);
    } catch (error) {
      console.error("Clip generation failed:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not generate this clip.";

      setFailedClips((currentFailures) => [
        ...currentFailures.filter(
          (failure) => failure.photoNumber !== photoNumber
        ),
        {
          imageUrl,
          photoNumber,
          error: errorMessage,
        },
      ]);

      setClipMessage(errorMessage);
    } finally {
      setIsGeneratingClip(false);
      setGeneratingImageUrl("");
    }
  }

  async function generateAllClips() {
    if (images.length === 0 || isGeneratingAll) {
      return;
    }

    setIsGeneratingAll(true);
    setIsGeneratingClip(false);
    setGeneratingImageUrl("");
    setGeneratedClips([]);
    setFailedClips([]);
    setCurrentClipNumber(0);
    setTotalClipCount(images.length);

    let successfulCount = 0;
    let failedCount = 0;

    for (let index = 0; index < images.length; index++) {
      const imageUrl = images[index];
      const photoNumber = index + 1;

      setCurrentClipNumber(photoNumber);
      setGeneratingImageUrl(imageUrl);
      setClipMessage(
        `Generating clip ${photoNumber} of ${images.length}...`
      );

      try {
        const data = await requestClip(imageUrl);

        if (!data.success || !data.videoUrl) {
          throw new Error(
            data.message ?? "No video was returned by Runway."
          );
        }

        const newClip: GeneratedClip = {
          imageUrl,
          videoUrl: data.videoUrl,
          photoNumber,
        };

        setGeneratedClips((currentClips) => [
          ...currentClips,
          newClip,
        ]);

        successfulCount += 1;
      } catch (error) {
        console.error(
          `Clip ${photoNumber} generation failed:`,
          error
        );

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown generation error.";

        setFailedClips((currentFailures) => [
          ...currentFailures,
          {
            imageUrl,
            photoNumber,
            error: errorMessage,
          },
        ]);

        failedCount += 1;
      }
    }

    setGeneratingImageUrl("");
    setCurrentClipNumber(images.length);
    setClipMessage(
      `Finished! Generated ${successfulCount} of ${
        images.length
      } clips.${
        failedCount > 0
          ? ` ${failedCount} clip${
              failedCount === 1 ? "" : "s"
            } failed.`
          : ""
      }`
    );
    setIsGeneratingAll(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-bold tracking-tight">
            WalkNWow<span className="text-cyan-400">.AI</span>
          </div>

          <button
            type="button"
            className="rounded-full border border-white/20 px-5 py-2 text-sm transition hover:border-white/40"
          >
            Sign in
          </button>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              AI-powered real estate walkthroughs
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
              Turn listing photos into a cinematic walkthrough.
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-white/60">
              Paste a real estate listing link and let WalkNWow.AI
              transform the property photos into polished cinematic
              content for listings, websites, and social media.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-12 max-w-5xl rounded-3xl border border-white/10 bg-white/[0.05] p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={listingUrl}
                onChange={(event) => {
                  setListingUrl(event.target.value);
                  setMessage("");
                }}
                placeholder="Paste a Zillow listing URL"
                aria-label="Real estate listing URL"
                className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black px-5 text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
              />

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isGeneratingAll ||
                  isGeneratingClip
                }
                className="min-h-14 rounded-2xl bg-white px-8 font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Extracting photos..."
                  : "Create walkthrough"}
              </button>
            </div>

            {message && (
              <p className="px-2 pb-1 pt-3 text-left text-sm text-cyan-200">
                {message}
              </p>
            )}
          </form>

          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/45">
            <span>✓ No filming required</span>
            <span>✓ Listing photos transformed by AI</span>
            <span>✓ Social-ready exports</span>
          </div>

          {images.length > 0 && (
            <section className="mx-auto mt-16 max-w-7xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Extracted property photos
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    Generate one cinematic clip for every extracted
                    property photo.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-center text-sm text-cyan-200">
                    {images.length} photos
                  </span>

                  <button
                    type="button"
                    onClick={generateAllClips}
                    disabled={isGeneratingAll || isGeneratingClip}
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingAll
                      ? `Generating ${currentClipNumber} of ${totalClipCount}...`
                      : `Generate all ${images.length} clips`}
                  </button>
                </div>
              </div>

              {clipMessage && (
                <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-center text-cyan-100">
                  <p>{clipMessage}</p>

                  {isGeneratingAll && totalClipCount > 0 && (
                    <div className="mx-auto mt-4 max-w-xl">
                      <div className="h-3 overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (currentClipNumber /
                                totalClipCount) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-sm text-cyan-100/70">
                        {generatedClips.length} completed
                        {failedClips.length > 0
                          ? ` • ${failedClips.length} failed`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {generatedClips.length > 0 && (
                <div className="mb-12">
                  <h3 className="mb-5 text-xl font-semibold">
                    Generated clips ({generatedClips.length})
                  </h3>

                  <div className="grid gap-5 md:grid-cols-3">
                    {generatedClips.map((clip) => (
                      <div
                        key={`${clip.videoUrl}-${clip.photoNumber}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <video
                          src={clip.videoUrl}
                          controls
                          playsInline
                          className="aspect-video w-full rounded-xl object-cover"
                        />

                        <p className="mt-3 text-center text-sm text-white/50">
                          Clip {clip.photoNumber}
                        </p>

                        <a
                          href={clip.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold transition hover:bg-white/10"
                        >
                          Open clip
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {failedClips.length > 0 && (
                <div className="mb-12 rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
                  <h3 className="font-semibold text-red-200">
                    Clips that failed
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-red-100/75">
                    {failedClips.map((failure) => (
                      <p key={failure.photoNumber}>
                        Photo {failure.photoNumber}: {failure.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((imageUrl, index) => {
                  const photoNumber = index + 1;

                  const isThisClipGenerating =
                    (isGeneratingClip || isGeneratingAll) &&
                    generatingImageUrl === imageUrl;

                  const completedClip = generatedClips.find(
                    (clip) => clip.photoNumber === photoNumber
                  );

                  return (
                    <article
                      key={`${imageUrl}-${index}`}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                    >
                      <img
                        src={imageUrl}
                        alt={`Property photo ${photoNumber}`}
                        className="aspect-[4/3] w-full object-cover"
                      />

                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm text-white/50">
                            Photo {photoNumber}
                          </p>

                          {completedClip && (
                            <span className="text-sm font-semibold text-cyan-300">
                              ✓ Clip ready
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            generateSingleClip(
                              imageUrl,
                              photoNumber
                            )
                          }
                          disabled={
                            isGeneratingClip || isGeneratingAll
                          }
                          className="block w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isThisClipGenerating
                            ? "Generating AI clip..."
                            : completedClip
                              ? "Regenerate clip"
                              : "Generate AI clip"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            How it works
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight">
            From listing link to cinematic property content.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Paste the listing",
                text: "Add the Zillow listing URL to extract the property photos.",
              },
              {
                number: "02",
                title: "Generate every clip",
                text: "WalkNWow creates and saves one cinematic clip for each property photo.",
              },
              {
                number: "03",
                title: "Build the walkthrough",
                text: "The next phase combines the saved clips into one finished property video.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-white/10 bg-black p-7"
              >
                <div className="text-sm font-semibold text-cyan-300">
                  {item.number}
                </div>

                <h3 className="mt-6 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-white/55">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 WalkNWow.AI</p>
          <p>AI-powered property walkthroughs.</p>
        </div>
      </footer>
    </main>
  );
}