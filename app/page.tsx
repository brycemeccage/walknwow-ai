"use client";

import { FormEvent, useMemo, useState } from "react";

type RiskLevel = "low" | "medium" | "high";

type WalkthroughResponse = {
  success?: boolean;
  message?: string;
  jobId?: string;
  imageCount?: number;
  images?: string[];
};

type PropertyDNA = {
  propertyType?: string;
  architecturalStyle?: string;
  luxuryLevel?: string;
  exterior?: Record<string, unknown>;
  interior?: Record<string, unknown>;
  kitchen?: Record<string, unknown>;
  livingAreas?: Record<string, unknown>;
  bedrooms?: Record<string, unknown>;
  bathrooms?: Record<string, unknown>;
  outdoor?: Record<string, unknown>;
  standoutFeatures?: string[];
  continuityRules?: string[];
};

type DirectorScene = {
  sceneNumber?: number;
  photoNumber: number;
  category?: string;
  roomLabel?: string;
  storyRole?: string;
  qualityScore?: number;
  storytellingScore?: number;
  animationSuitabilityScore?: number;
  distortionRisk?: RiskLevel;
  blurRisk?: RiskLevel;
  duplicateOf?: number;
  visibleFeatures?: string[];
  cameraMove?: string;
  movementAmount?: "micro" | "subtle" | "moderate";
  transitionIntent?: string;
  preservationRules?: string[];
  estimatedDurationSeconds?: number;
  include?: boolean;
  reason?: string;
};

type DirectorPayload = {
  selectedPhotoNumbers?: number[];
  scenes?: DirectorScene[];
  propertyDNA?: PropertyDNA;
  propertySummary?: string;
  estimatedRuntimeSeconds?: number;
  coverageScore?: number;
  storytellingScore?: number;
  continuityScore?: number;
  directorNotes?: string[];
};

type DirectorResponse = {
  success?: boolean;
  message?: string;
  imageCount?: number;
  director?: DirectorPayload;
  selectedPhotoNumbers?: number[];
  scenes?: DirectorScene[];
  propertyDNA?: PropertyDNA;
  propertySummary?: string;
  usedFallback?: boolean;
};

type RetryAttempt = {
  attemptNumber?: number;
  status?: "passed" | "failed" | "error";
  videoUrl?: string;
  taskId?: string;
  overallScore?: number;
  pass?: boolean;
  problems?: string[];
  strengths?: string[];
  retryPrompt?: string;
  runtimeSeconds?: number;
};

type RetryManagerResponse = {
  success?: boolean;
  passed?: boolean;
  bestAttempt?: RetryAttempt;
  attempts?: RetryAttempt[];
  totalAttempts?: number;
  totalRuntimeSeconds?: number;
  message?: string;
};

type UpscaleResponse = {
  success?: boolean;
  message?: string;
  taskId?: string;
  upscaledVideoUrl?: string;
  resolution?: string;
};

type QualityAnalysis = {
  pass: boolean;
  overallScore: number;
  sharpnessScore: number;
  architectureScore: number;
  geometryScore: number;
  continuityScore: number;
  motionScore: number;
  flickerScore: number;
  openingBlurDetected: boolean;
  architectureChanged: boolean;
  geometryWarpDetected: boolean;
  furnitureOrFixtureChanged: boolean;
  lightingFlickerDetected: boolean;
  problems: string[];
  strengths: string[];
  retryPrompt: string;
};

type QualityResponse = {
  success?: boolean;
  message?: string;
  analysis?: QualityAnalysis;
  usedFallback?: boolean;
};

type GeneratedClip = {
  photoNumber: number;
  imageUrl: string;
  originalVideoUrl: string;
  videoUrl: string;
  upscaled: boolean;
  upscaleResolution?: string;
  quality?: QualityAnalysis;
  attempts: number;
};

type FailedClip = {
  photoNumber: number;
  imageUrl: string;
  error: string;
};

type MergeResponse = {
  success?: boolean;
  message?: string;
  clipCount?: number;
  filename?: string;
  videoUrl?: string;
  music?: { profile?: string; track?: string };
};

const CONCURRENCY = 5;
const ENABLE_2K_UPSCALE = true;

function needsQualityInspection(scene: DirectorScene): boolean {
  return (
    scene.distortionRisk === "high" ||
    scene.blurRisk === "high" ||
    scene.category === "front_exterior" ||
    scene.category === "rear_exterior" ||
    scene.category === "kitchen" ||
    scene.category === "primary_bathroom" ||
    scene.category === "bathroom" ||
    scene.category === "stairs"
  );
}

function isMajorQualityFailure(
  quality: QualityAnalysis
): boolean {
  return (
    quality.openingBlurDetected ||
    quality.architectureChanged ||
    quality.geometryWarpDetected ||
    quality.furnitureOrFixtureChanged ||
    quality.overallScore < 70
  );
}

function uniqueValidPhotoNumbers(values: unknown, imageCount: number): number[] {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values.filter(
        (value): value is number =>
          Number.isInteger(value) && value >= 1 && value <= imageCount
      )
    )
  );
}

function risk(value: unknown, fallback: RiskLevel): RiskLevel {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : fallback;
}

function buildFallbackScene(photoNumber: number): DirectorScene {
  return {
    photoNumber,
    category: "other",
    roomLabel: `Photo ${photoNumber}`,
    storyRole: "Property walkthrough scene",
    distortionRisk: "medium",
    blurRisk: "medium",
    visibleFeatures: [],
    cameraMove:
  "Keep the camera perfectly level. Use only one tiny left-to-right or right-to-left slide OR one tiny smooth zoom out. Never move up, down, diagonally, orbit, roll, float, tilt, or crane. The environment—not the camera—must create the feeling of motion.",
    transitionIntent: "End naturally for a clean cut to the next scene.",
    preservationRules: [
      "Preserve every visible architectural line exactly.",
      "Do not move, replace, add, or remove furniture or fixtures.",
    ],
    estimatedDurationSeconds: 4,
    include: true,
    reason: "Selected for property coverage.",
  };
}

export default function Home() {
  const [listingUrl, setListingUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [director, setDirector] = useState<DirectorPayload | null>(null);
  const [selectedPhotoNumbers, setSelectedPhotoNumbers] = useState<number[]>([]);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [failedClips, setFailedClips] = useState<FailedClip[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDirecting, setIsDirecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [walkthroughUrl, setWalkthroughUrl] = useState("");
  const [walkthroughFilename, setWalkthroughFilename] = useState("walkthrough.mp4");
  const [musicOverride, setMusicOverride] = useState("auto");
  const [selectedMusicLabel, setSelectedMusicLabel] = useState("");

  const isBusy = isExtracting || isDirecting || isGenerating || isMerging;

  const selectedScenes = useMemo(() => {
    const sceneMap = new Map<number, DirectorScene>();

    for (const scene of director?.scenes ?? []) {
      if (Number.isInteger(scene.photoNumber) && scene.photoNumber >= 1) {
        sceneMap.set(scene.photoNumber, scene);
      }
    }

    return selectedPhotoNumbers.map(
      (photoNumber) => sceneMap.get(photoNumber) ?? buildFallbackScene(photoNumber)
    );
  }, [director, selectedPhotoNumbers]);

  const clipsInStoryOrder = useMemo(() => {
    return selectedPhotoNumbers
      .map((photoNumber) =>
        generatedClips.find((clip) => clip.photoNumber === photoNumber)
      )
      .filter((clip): clip is GeneratedClip => Boolean(clip));
  }, [generatedClips, selectedPhotoNumbers]);

  async function requestJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as T;

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : `Request failed with status ${response.status}.`;
      throw new Error(message);
    }

    return data;
  }

  async function runDirector(photos: string[]): Promise<void> {
    setIsDirecting(true);
    setStatusMessage(`V2 Director is analyzing ${photos.length} photos...`);

    try {
      const response = await requestJson<DirectorResponse>(
        "/api/walkthroughs/director",
        { images: photos, listingUrl }
      );

      if (!response.success) {
        throw new Error(
          response.message ?? "The V2 Director could not analyze this property."
        );
      }

      const payload: DirectorPayload = response.director ?? {
        selectedPhotoNumbers: response.selectedPhotoNumbers,
        scenes: response.scenes,
        propertyDNA: response.propertyDNA,
        propertySummary: response.propertySummary,
      };

      let selected = uniqueValidPhotoNumbers(
        payload.selectedPhotoNumbers,
        photos.length
      );

      if (selected.length === 0) {
        selected = uniqueValidPhotoNumbers(
          payload.scenes
            ?.filter((scene) => scene.include === true)
            .map((scene) => scene.photoNumber),
          photos.length
        );
      }

      if (selected.length === 0) {
        throw new Error(
          "Director returned no selected photos. Refusing to fall back to all listing photos."
        );
      }

      const normalizedScenes = selected.map(
        (photoNumber) =>
          payload.scenes?.find(
            (scene) =>
              scene.photoNumber === photoNumber &&
              scene.include === true
          ) ??
          buildFallbackScene(photoNumber)
      );

      setDirector({
        ...payload,
        selectedPhotoNumbers: selected,
        scenes: normalizedScenes,
      });
      setSelectedPhotoNumbers(selected);
      setStatusMessage(
        `V2 Director selected ${selected.length} of ${photos.length} photos.`
      );
    } finally {
      setIsDirecting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!listingUrl.trim()) {
      setErrorMessage("Paste a Zillow listing URL first.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("Extracting listing photos...");
    setImages([]);
    setDirector(null);
    setSelectedPhotoNumbers([]);
    setGeneratedClips([]);
    setFailedClips([]);
    setCompletedCount(0);
    setWalkthroughUrl("");
    setWalkthroughFilename("walkthrough.mp4");
    setIsExtracting(true);

    try {
      const response = await requestJson<WalkthroughResponse>(
        "/api/walkthroughs",
        { listingUrl: listingUrl.trim() }
      );

      if (!response.success) {
        throw new Error(response.message ?? "The listing could not be processed.");
      }

      const extractedImages = Array.isArray(response.images)
        ? response.images.filter(
            (image): image is string => typeof image === "string" && image.length > 0
          )
        : [];

      if (extractedImages.length === 0) {
        throw new Error("No property photos were returned.");
      }

      setImages(extractedImages);
      setStatusMessage(`Found ${extractedImages.length} photos.`);
      await runDirector(extractedImages);
    } catch (error) {
      console.error("V2 walkthrough setup failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "The listing could not be processed."
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function togglePhoto(photoNumber: number) {
    if (isBusy) return;

    setSelectedPhotoNumbers((current) =>
      current.includes(photoNumber)
        ? current.filter((number) => number !== photoNumber)
        : [...current, photoNumber].sort((a, b) => a - b)
    );
  }

  async function generateClip(
    scene: DirectorScene,
    imageUrl: string
  ): Promise<RetryManagerResponse> {
    return await requestJson<RetryManagerResponse>(
      "/api/walkthroughs/retry-manager",
      {
        imageUrl,
        category: scene.category ?? "other",
        scene,
        propertyDNA: director?.propertyDNA ?? {},
        maxAttempts: 3,
        passingScore: 90,
      }
    );
  }

  async function upscaleAcceptedClip(
    videoUrl: string
  ): Promise<UpscaleResponse> {
    return await requestJson<UpscaleResponse>(
      "/api/walkthroughs/upscale-video",
      {
        videoUrl,
        resolution: "2k",
      }
    );
  }

  async function generateOneScene(scene: DirectorScene): Promise<void> {
    const imageUrl = images[scene.photoNumber - 1];

    if (!imageUrl) {
      throw new Error(`Photo ${scene.photoNumber} is missing.`);
    }

    const generated = await generateClip(
      scene,
      imageUrl
    );

    const bestAttempt = generated.bestAttempt;
    const originalVideoUrl =
      bestAttempt?.videoUrl?.trim() ?? "";

    if (
      !generated.success ||
      !originalVideoUrl
    ) {
      throw new Error(
        generated.message ??
          "Retry Manager returned no usable video."
      );
    }

    let finalVideoUrl = originalVideoUrl;
    let upscaled = false;
    let upscaleResolution = "";

    if (ENABLE_2K_UPSCALE) {
      setStatusMessage(
        `Photo ${scene.photoNumber} selected its best attempt. Upscaling to 2K...`
      );

      try {
        const upscaleResult =
          await upscaleAcceptedClip(
            originalVideoUrl
          );

        if (
          upscaleResult.success &&
          upscaleResult.upscaledVideoUrl
        ) {
          finalVideoUrl =
            upscaleResult.upscaledVideoUrl;
          upscaled = true;
          upscaleResolution =
            upscaleResult.resolution ?? "2k";
        }
      } catch (upscaleError) {
        console.error(
          `Photo ${scene.photoNumber} upscale failed; using the Retry Manager winner:`,
          upscaleError
        );
      }
    }

    const quality: QualityAnalysis | undefined =
      typeof bestAttempt?.overallScore === "number"
        ? {
            pass: bestAttempt.pass === true,
            overallScore: bestAttempt.overallScore,
            sharpnessScore: 0,
            architectureScore: 0,
            geometryScore: 0,
            continuityScore: 0,
            motionScore: 0,
            flickerScore: 0,
            openingBlurDetected: false,
            architectureChanged: false,
            geometryWarpDetected: false,
            furnitureOrFixtureChanged: false,
            lightingFlickerDetected: false,
            problems: bestAttempt.problems ?? [],
            strengths: bestAttempt.strengths ?? [],
            retryPrompt: bestAttempt.retryPrompt ?? "",
          }
        : undefined;

    const clip: GeneratedClip = {
      photoNumber: scene.photoNumber,
      imageUrl,
      originalVideoUrl,
      videoUrl: finalVideoUrl,
      upscaled,
      upscaleResolution,
      quality,
      attempts:
        generated.totalAttempts ??
        generated.attempts?.length ??
        1,
    };

    setGeneratedClips((current) =>
      [
        ...current.filter(
          (existing) =>
            existing.photoNumber !==
            scene.photoNumber
        ),
        clip,
      ].sort(
        (a, b) =>
          a.photoNumber - b.photoNumber
      )
    );

    setCompletedCount(
      (current) => current + 1
    );
  }

  async function generateAll(): Promise<void> {
    if (selectedScenes.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage("");
    setGeneratedClips([]);
    setFailedClips([]);
    setCompletedCount(0);
    setWalkthroughUrl("");
    setStatusMessage(
      `Generating ${selectedScenes.length} scenes with up to ${CONCURRENCY} workers, then upscaling accepted clips to 2K...`
    );

    try {
      for (
        let start = 0;
        start < selectedScenes.length;
        start += CONCURRENCY
      ) {
        const batch = selectedScenes.slice(start, start + CONCURRENCY);

        await Promise.all(
          batch.map(async (scene) => {
            try {
              await generateOneScene(scene);
            } catch (error) {
              const imageUrl = images[scene.photoNumber - 1] ?? "";

              setFailedClips((current) => [
                ...current.filter(
                  (failure) => failure.photoNumber !== scene.photoNumber
                ),
                {
                  photoNumber: scene.photoNumber,
                  imageUrl,
                  error:
                    error instanceof Error ? error.message : "Generation failed.",
                },
              ]);
              setCompletedCount((current) => current + 1);
            }
          })
        );
      }

      setStatusMessage(
        "Generation finished. Retry Manager selected the best attempt for every successful scene, then upscaled winners to 2K when available."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function mergeWalkthrough(): Promise<void> {
    if (clipsInStoryOrder.length < 2 || isMerging) return;

    setIsMerging(true);
    setErrorMessage("");
    setStatusMessage(`Merging ${clipsInStoryOrder.length} clips...`);

    try {
      const response = await requestJson<MergeResponse>(
        "/api/walkthroughs/merge-clips",
        {
          clips: clipsInStoryOrder.map((clip) => clip.videoUrl),
          propertyDNA: director?.propertyDNA ?? {},
          musicProfile: musicOverride,
        }
      );

      if (!response.success || !response.videoUrl) {
        throw new Error(
          response.message ?? "The walkthrough could not be merged."
        );
      }

      setWalkthroughUrl(response.videoUrl);
      setWalkthroughFilename(response.filename ?? "walkthrough.mp4");
      setSelectedMusicLabel(
        response.music?.track
          ? `${response.music.profile ?? "auto"} · ${response.music.track}`
          : ""
      );
      setStatusMessage(
        `Walkthrough ready with ${
          response.clipCount ?? clipsInStoryOrder.length
        } clips.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The walkthrough could not be merged."
      );
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-bold">
            WalkNWow<span className="text-cyan-300">.AI</span>
          </div>

          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            V2 Retry Mode · 5 workers · 2K winners
          </span>
        </div>
      </nav>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
              AI real-estate production
            </p>

            <h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-7xl">
              One listing. One complete walkthrough.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/55">
              V2 extracts the listing, directs the property story, generates
              lifelike scenes, inspects quality, retries weak clips, and builds
              the final video.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={listingUrl}
                onChange={(event) => setListingUrl(event.target.value)}
                placeholder="Paste a Zillow listing URL"
                className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black px-5 outline-none placeholder:text-white/25 focus:border-cyan-300/60"
              />

              <button
                type="submit"
                disabled={isBusy}
                className="min-h-14 rounded-2xl bg-white px-7 font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExtracting || isDirecting ? "Preparing V2..." : "Create V2 project"}
              </button>
            </div>
          </form>

          {(statusMessage || errorMessage) && (
            <div className="mx-auto mt-6 max-w-5xl space-y-3">
              {statusMessage && (
                <p className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-5 py-4 text-cyan-100">
                  {statusMessage}
                </p>
              )}

              {errorMessage && (
                <p className="rounded-2xl border border-red-300/20 bg-red-300/[0.08] px-5 py-4 text-red-100">
                  {errorMessage}
                </p>
              )}
            </div>
          )}

          {images.length > 0 && (
            <section className="mt-14">
              <div className="grid gap-5 lg:grid-cols-4">
                <StatCard label="Photos" value={images.length} />
                <StatCard label="Director scenes" value={selectedPhotoNumbers.length} />
                <StatCard label="Completed clips" value={generatedClips.length} />
                <StatCard label="Failed clips" value={failedClips.length} />
              </div>

              {director && (
                <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        V2 Director
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold">
                        {director.propertySummary ?? "Complete property walkthrough"}
                      </h2>

                      <p className="mt-2 text-sm text-white/50">
                        Toggle any photo before generation. V2 sends scene direction
                        and Property DNA into Runway.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhotoNumbers(
                            images.map((_, index) => index + 1)
                          )
                        }
                        disabled={isBusy}
                        className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                      >
                        Select all
                      </button>

                      <button
                        type="button"
                        onClick={generateAll}
                        disabled={isBusy || selectedPhotoNumbers.length === 0}
                        className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-black hover:bg-cyan-200 disabled:opacity-50"
                      >
                        {isGenerating
                          ? `Generating ${completedCount}/${selectedScenes.length}`
                          : `Generate ${selectedScenes.length} V2 scenes`}
                      </button>
                    </div>
                  </div>

                  {isGenerating && selectedScenes.length > 0 && (
                    <div className="mt-5">
                      <div className="h-3 overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full bg-cyan-300 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (completedCount / selectedScenes.length) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {generatedClips.length > 0 && (
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        Final editor
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold">
                        Merge approved V2 clips
                      </h2>

                      <p className="mt-2 text-sm text-white/50">
                        Retry Manager selects the strongest attempt for every scene. Winners are
                        upscaled to 2K before the final smooth merge.
                      </p>
                    </div>

                    <select
                      value={musicOverride}
                      onChange={(event) => setMusicOverride(event.target.value)}
                      disabled={isBusy}
                      className="rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white"
                    >
                      <option value="auto">Music: Auto</option>
                      <option value="luxury-cinematic">Luxury cinematic</option>
                      <option value="modern-minimal">Modern minimal</option>
                      <option value="warm-elegant">Warm elegant</option>
                      <option value="coastal-airy">Coastal airy</option>
                      <option value="rustic-organic">Rustic organic</option>
                      <option value="urban-contemporary">Urban contemporary</option>
                      <option value="bright-lifestyle">Bright lifestyle</option>
                      <option value="dramatic-estate">Dramatic estate</option>
                    </select>

                    <button
                      type="button"
                      onClick={mergeWalkthrough}
                      disabled={isBusy || clipsInStoryOrder.length < 2}
                      className="rounded-xl bg-white px-5 py-3 font-semibold text-black hover:bg-cyan-100 disabled:opacity-50"
                    >
                      {isMerging ? "Merging..." : `Merge ${clipsInStoryOrder.length} clips`}
                    </button>
                  </div>

                  {selectedMusicLabel && (
                    <p className="mt-4 text-sm text-cyan-200">
                      Soundtrack: {selectedMusicLabel}
                    </p>
                  )}

                  {walkthroughUrl && (
                    <div className="mt-6">
                      <video
                        src={walkthroughUrl}
                        controls
                        playsInline
                        className="aspect-video w-full rounded-2xl bg-black object-contain"
                      />

                      <a
                        href={walkthroughUrl}
                        download={walkthroughFilename}
                        className="mt-4 block rounded-xl bg-cyan-300 px-5 py-3 text-center font-semibold text-black"
                      >
                        Download walkthrough
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {images.map((imageUrl, index) => {
                  const photoNumber = index + 1;
                  const selected = selectedPhotoNumbers.includes(photoNumber);
                  const scene = director?.scenes?.find(
                    (item) => item.photoNumber === photoNumber
                  );
                  const clip = generatedClips.find(
                    (item) => item.photoNumber === photoNumber
                  );
                  const failure = failedClips.find(
                    (item) => item.photoNumber === photoNumber
                  );

                  return (
                    <article
                      key={`${imageUrl}-${photoNumber}`}
                      className={`overflow-hidden rounded-2xl border ${
                        selected
                          ? "border-cyan-300/60 bg-cyan-300/[0.06]"
                          : "border-white/10 bg-white/[0.03] opacity-60"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Property photo ${photoNumber}`}
                        className="aspect-[4/3] w-full object-cover"
                      />

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">Photo {photoNumber}</p>
                          <span className="text-xs text-cyan-200">
                            {scene?.roomLabel ?? scene?.category ?? "property scene"}
                          </span>
                        </div>

                        {scene?.reason && (
                          <p className="mt-2 text-sm leading-6 text-white/50">
                            {scene.reason}
                          </p>
                        )}

                        {clip?.quality && (
                          <div
                            className={`mt-3 rounded-xl border p-3 text-sm ${
                              clip.quality.pass
                                ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100"
                                : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100"
                            }`}
                          >
                            Quality score: {clip.quality.overallScore}/100
                            <br />
                            Attempts: {clip.attempts}
                            <br />
                            {clip.upscaled
                              ? `Upscale: ${clip.upscaleResolution ?? "2K"} ready`
                              : "Upscale: original accepted clip"}
                          </div>
                        )}

                        {failure && (
                          <p className="mt-3 rounded-xl border border-red-300/20 bg-red-300/[0.07] p-3 text-sm text-red-100">
                            {failure.error}
                          </p>
                        )}

                        {clip && (
                          <video
                            src={clip.videoUrl}
                            controls
                            playsInline
                            className="mt-3 aspect-video w-full rounded-xl bg-black object-cover"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => togglePhoto(photoNumber)}
                          disabled={isBusy}
                          className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                        >
                          {selected ? "✓ Included in V2" : "Add to V2"}
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
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}
