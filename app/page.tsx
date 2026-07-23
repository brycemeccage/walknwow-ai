"use client";

import { FormEvent, useState } from "react";

type WalkthroughResponse = {
  success?: boolean;
  message?: string;
  jobId?: string;
  imageCount?: number;
  images?: string[];
};

type PropertyPhotoAnalysis = {
  photoNumber: number;
  category: string;
  qualityScore: number;
  storytellingScore: number;
  distortionRisk: "low" | "medium" | "high";
  decision: "keep" | "skip";
  storyRole: string;
  reason: string;
  duplicateOf: number;
  visibleFeatures: string[];
};

type PropertyBrainAnalysis = {
  propertyType: string;
  overallQualityScore: number;
  propertySummary: string;
  propertyMemory: {
    exterior: string;
    frontDoor: string;
    roof: string;
    windows: string;
    kitchen: string;
    flooring: string;
    fireplace: string;
    landscaping: string;
    standoutFeatures: string[];
  };
  recommendedSequence: number[];
  photos: PropertyPhotoAnalysis[];
  skippedSummary: Array<{
    photoNumber: number;
    reason: string;
  }>;
  directorNotes: string[];
};

type PropertyBrainResponse = {
  success?: boolean;
  message?: string;
  imageCount?: number;
  analysis?: PropertyBrainAnalysis;
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
  const [selectedPhotoNumbers, setSelectedPhotoNumbers] = useState<number[]>([]);
  const [propertyAnalysis, setPropertyAnalysis] =
    useState<PropertyBrainAnalysis | null>(null);
  const [isAnalyzingProperty, setIsAnalyzingProperty] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
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
    setSelectedPhotoNumbers([]);
    setPropertyAnalysis(null);
    setAnalysisMessage("");
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
      setSelectedPhotoNumbers(
        extractedImages.slice(0, 15).map((_, index) => index + 1)
      );

      if (extractedImages.length > 0) {
        void analyzeProperty(extractedImages);
      }

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

  const selectedPhotos = selectedPhotoNumbers
    .map((photoNumber) => ({
      imageUrl: images[photoNumber - 1],
      photoNumber,
    }))
    .filter(
      (photo): photo is {
        imageUrl: string;
        photoNumber: number;
      } => Boolean(photo.imageUrl)
    );

  function togglePhotoSelection(photoNumber: number) {
    if (isGeneratingAll || isGeneratingClip) {
      return;
    }

    setSelectedPhotoNumbers((current) =>
      current.includes(photoNumber)
        ? current.filter((number) => number !== photoNumber)
        : [...current, photoNumber].sort((a, b) => a - b)
    );
  }

  function selectFirstFifteen() {
    setSelectedPhotoNumbers(
      images.slice(0, 15).map((_, index) => index + 1)
    );
  }

  function selectAllPhotos() {
    setSelectedPhotoNumbers(
      images.map((_, index) => index + 1)
    );
  }

  function clearPhotoSelection() {
    setSelectedPhotoNumbers([]);
  }

  async function analyzeProperty(
    imagesToAnalyze: string[] = images
  ) {
    if (imagesToAnalyze.length === 0 || isAnalyzingProperty) {
      return;
    }

    setIsAnalyzingProperty(true);
    setAnalysisMessage(
      `Property Brain is analyzing ${imagesToAnalyze.length} photos...`
    );
    setPropertyAnalysis(null);

    try {
      const response = await fetch(
        "/api/walkthroughs/property-brain",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: imagesToAnalyze,
          }),
        }
      );

      const rawResponse = await response.text();

      console.log("========== PROPERTY BRAIN RESPONSE ==========");
      console.log(rawResponse);
      console.log("=============================================");

      let data: PropertyBrainResponse;

      try {
        data = JSON.parse(rawResponse) as PropertyBrainResponse;
      } catch {
        throw new Error(
          "Property Brain server did not return valid JSON. Check the Terminal for the real error."
        );
      }

      if (!response.ok || !data.success || !data.analysis) {
        throw new Error(
          data.message ?? "Property Brain could not analyze this listing."
        );
      }

      const validRecommendedSequence =
        Array.isArray(data.analysis.recommendedSequence)
          ? data.analysis.recommendedSequence.filter(
              (photoNumber) =>
                Number.isInteger(photoNumber) &&
                photoNumber >= 1 &&
                photoNumber <= imagesToAnalyze.length
            )
          : [];

      const cleanedAnalysis: PropertyBrainAnalysis = {
        ...data.analysis,
        recommendedSequence: validRecommendedSequence,
        photos: Array.isArray(data.analysis.photos)
          ? data.analysis.photos
          : [],
        skippedSummary: Array.isArray(data.analysis.skippedSummary)
          ? data.analysis.skippedSummary
          : [],
        directorNotes: Array.isArray(data.analysis.directorNotes)
          ? data.analysis.directorNotes
          : [],
      };

      setPropertyAnalysis(cleanedAnalysis);
      setSelectedPhotoNumbers(validRecommendedSequence);
      setAnalysisMessage(
        `Property Brain selected ${validRecommendedSequence.length} of ${imagesToAnalyze.length} photos.`
      );
    } catch (error) {
      console.error("Property Brain analysis failed:", error);

      setAnalysisMessage(
        error instanceof Error
          ? error.message
          : "Property Brain could not analyze this listing."
      );
    } finally {
      setIsAnalyzingProperty(false);
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
    if (selectedPhotos.length === 0 || isGeneratingAll) {
      setClipMessage("Choose at least one Director Pick first.");
      return;
    }

    setIsGeneratingAll(true);
    setIsGeneratingClip(false);
    setGeneratingImageUrl("");
    setGeneratedClips([]);
    setFailedClips([]);
    setCurrentClipNumber(0);
    setTotalClipCount(selectedPhotos.length);

    let successfulCount = 0;
    let failedCount = 0;

    for (let index = 0; index < selectedPhotos.length; index++) {
      const { imageUrl, photoNumber } = selectedPhotos[index];

      setCurrentClipNumber(photoNumber);
      setGeneratingImageUrl(imageUrl);
      setClipMessage(
        `Generating Director Pick ${index + 1} of ${selectedPhotos.length} (Photo ${photoNumber})...`
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
    setCurrentClipNumber(selectedPhotos.length);
    setClipMessage(
      `Finished! Generated ${successfulCount} of ${
        selectedPhotos.length
      } Director Pick clips.${
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
                  isAnalyzingProperty ||
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
                    Property Brain selects the strongest shots, removes
                    duplicates, and builds the recommended story order.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-center text-sm text-white/60">
                      {images.length} found
                    </span>

                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-center text-sm text-cyan-200">
                      {selectedPhotoNumbers.length} Director Picks
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={generateAllClips}
                    disabled={
                      isAnalyzingProperty ||
                      isGeneratingAll ||
                      isGeneratingClip ||
                      selectedPhotoNumbers.length === 0
                    }
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingAll
                      ? `Generating ${currentClipNumber} of ${totalClipCount}...`
                      : `Generate ${selectedPhotoNumbers.length} Director Picks`}
                  </button>
                </div>
              </div>

              <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold">
                        🧠 Property Brain
                      </h3>

                      {propertyAnalysis && (
                        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                          {propertyAnalysis.overallQualityScore}/100 photo set
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                      Property Brain analyzes the complete listing, removes
                      duplicates and weak shots, flags distortion risks,
                      and builds a human-style walkthrough sequence.
                    </p>

                    {analysisMessage && (
                      <p className="mt-4 text-sm text-cyan-100">
                        {analysisMessage}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => analyzeProperty()}
                    disabled={
                      isAnalyzingProperty ||
                      isGeneratingAll ||
                      isGeneratingClip
                    }
                    className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAnalyzingProperty
                      ? "Analyzing property..."
                      : propertyAnalysis
                        ? "Analyze again"
                        : "Analyze property"}
                  </button>
                </div>

                {propertyAnalysis && (
                  <div className="mt-7 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                          Property
                        </p>
                        <h4 className="mt-2 text-lg font-semibold">
                          {propertyAnalysis.propertyType}
                        </h4>
                        <p className="mt-3 text-sm leading-6 text-white/55">
                          {propertyAnalysis.propertySummary}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                          Director result
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                          {propertyAnalysis.recommendedSequence.length}
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          recommended shots from {images.length} listing photos
                        </p>
                        <p className="mt-3 text-sm text-white/45">
                          {propertyAnalysis.skippedSummary.length} weak,
                          duplicate, risky, or redundant photos removed
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">
                        Recommended walkthrough story
                      </h4>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {propertyAnalysis.recommendedSequence.map(
                          (photoNumber, storyIndex) => {
                            const photoAnalysis =
                              propertyAnalysis.photos.find(
                                (photo) =>
                                  photo.photoNumber === photoNumber
                              );

                            return (
                              <button
                                type="button"
                                key={`${photoNumber}-${storyIndex}`}
                                onClick={() =>
                                  togglePhotoSelection(photoNumber)
                                }
                                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-left text-sm text-cyan-100 transition hover:bg-cyan-300/20"
                              >
                                <span className="font-semibold">
                                  {storyIndex + 1}. Photo {photoNumber}
                                </span>
                                <span className="ml-2 text-cyan-100/65">
                                  {photoAnalysis?.storyRole ??
                                    photoAnalysis?.category ??
                                    "Recommended shot"}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {propertyAnalysis.skippedSummary.length > 0 && (
                      <div>
                        <h4 className="font-semibold">
                          Removed by Property Brain
                        </h4>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {propertyAnalysis.skippedSummary.map(
                            (skippedPhoto) => (
                              <div
                                key={skippedPhoto.photoNumber}
                                className="rounded-xl border border-red-300/15 bg-red-300/[0.06] p-4"
                              >
                                <p className="font-semibold text-red-100">
                                  Photo {skippedPhoto.photoNumber}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-red-100/65">
                                  {skippedPhoto.reason}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {propertyAnalysis.directorNotes.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <h4 className="font-semibold">Director notes</h4>
                        <div className="mt-3 space-y-2 text-sm leading-6 text-white/55">
                          {propertyAnalysis.directorNotes.map(
                            (note, index) => (
                              <p key={`${note}-${index}`}>• {note}</p>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

                  const isSelected =
                    selectedPhotoNumbers.includes(photoNumber);

                  const photoAnalysis =
                    propertyAnalysis?.photos.find(
                      (photo) =>
                        photo.photoNumber === photoNumber
                    );

                  return (
                    <article
                      key={`${imageUrl}-${index}`}
                      className={`overflow-hidden rounded-2xl border transition ${
                        isSelected
                          ? "border-cyan-300/70 bg-cyan-400/[0.08]"
                          : "border-white/10 bg-white/[0.04] opacity-65"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt={`Property photo ${photoNumber}`}
                          className="aspect-[4/3] w-full object-cover"
                        />

                        {photoAnalysis && (
                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white">
                              {photoAnalysis.category.replaceAll("_", " ")}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                photoAnalysis.distortionRisk === "high"
                                  ? "bg-red-500/90 text-white"
                                  : photoAnalysis.distortionRisk === "medium"
                                    ? "bg-amber-400/90 text-black"
                                    : "bg-emerald-400/90 text-black"
                              }`}
                            >
                              {photoAnalysis.distortionRisk} risk
                            </span>
                          </div>
                        )}
                      </div>

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

                        {photoAnalysis && (
                          <div className="mb-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-white/55">
                                Quality {photoAnalysis.qualityScore}/100
                              </span>
                              <span className="text-white/55">
                                Story {photoAnalysis.storytellingScore}/100
                              </span>
                            </div>

                            <p className="mt-2 leading-5 text-white/60">
                              {photoAnalysis.reason}
                            </p>

                            {photoAnalysis.duplicateOf > 0 && (
                              <p className="mt-2 text-red-200/80">
                                Similar to Photo {photoAnalysis.duplicateOf}
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            togglePhotoSelection(photoNumber)
                          }
                          disabled={
                            isGeneratingClip || isGeneratingAll
                          }
                          className={`mb-3 block w-full rounded-xl border px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSelected
                              ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20"
                              : "border-white/15 text-white/65 hover:bg-white/10"
                          }`}
                        >
                          {isSelected
                            ? "✓ Included in walkthrough"
                            : "Skipped — click to override"}
                        </button>

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
                title: "Direct the story",
                text: "Choose the strongest 12–15 shots and skip duplicates, risky close-ups, and weak angles.",
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