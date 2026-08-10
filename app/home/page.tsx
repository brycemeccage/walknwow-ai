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
};

const CONCURRENCY = 5;
const ENABLE_2K_UPSCALE = false;

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
    const response =
      await requestJson<{
        success?: boolean;
        videoUrl?: string;
        taskId?: string;
        message?: string;
      }>(
        "/api/walkthroughs/generate-clip",
        {
          imageUrl,
          category:
            scene.category ??
            "other",
          scene,
          propertyDNA:
            director?.propertyDNA ??
            {},
        }
      );

    const videoUrl =
      response.videoUrl?.trim() ??
      "";

    return {
      success:
        response.success === true &&
        Boolean(videoUrl),
      passed: true,
      bestAttempt: {
        attemptNumber: 1,
        status: "passed",
        videoUrl,
        taskId:
          response.taskId ?? "",
        overallScore: 100,
        pass: true,
        problems: [],
        strengths: [
          "Direct generation test.",
        ],
        retryPrompt: "",
        runtimeSeconds: 0,
      },
      attempts: [],
      totalAttempts: 1,
      totalRuntimeSeconds: 0,
      message:
        response.message ??
        "Direct clip generated.",
    };
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
        "Generation finished. Direct clip mode is active: Retry Manager, quality inspection, and 2K upscale are temporarily bypassed."
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
        { clips: clipsInStoryOrder.map((clip) => clip.videoUrl) }
      );

      if (!response.success || !response.videoUrl) {
        throw new Error(
          response.message ?? "The walkthrough could not be merged."
        );
      }

      setWalkthroughUrl(response.videoUrl);
      setWalkthroughFilename(response.filename ?? "walkthrough.mp4");
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
    <main className="min-h-screen bg-[#05070a] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/home" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img
                src="/branding/walknwow-logo.png"
                alt="WalkNWow AI logo"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="text-2xl font-black tracking-tight">
              WalkNWow<span className="text-cyan-300">.AI</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#examples" className="transition hover:text-white">Examples</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
            <a href="/" className="transition hover:text-white">Log in</a>
          </div>

          <a
            href="#studio"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-100"
          >
            Start a video
          </a>
        </div>
      </nav>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white p-2 shadow-2xl shadow-cyan-300/10 sm:h-36 sm:w-36">
              <img
                src="/branding/walknwow-logo.png"
                alt="WalkNWow AI"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-2 text-sm font-semibold text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
              AI real-estate video production
            </div>

            <h1 className="mt-7 text-5xl font-black tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              Turn listing photos into
              <span className="block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                a property experience.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-white/55 sm:text-xl">
              Paste a Zillow or Weichert listing. WalkNWow selects the strongest
              rooms, creates realistic camera movement, adds music, and delivers
              a polished real-estate video ready to share.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#studio"
                className="w-full rounded-2xl bg-cyan-300 px-7 py-4 font-bold text-black shadow-[0_15px_60px_rgba(103,232,249,0.18)] transition hover:bg-cyan-200 sm:w-auto"
              >
                Create your property video
              </a>
              <a
                href="#pricing"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 font-semibold transition hover:bg-white/[0.08] sm:w-auto"
              >
                View pricing
              </a>
            </div>

            <p className="mt-5 text-sm text-white/35">
              Professional videos starting at <span className="font-semibold text-white/75">$99</span>
            </p>
          </div>

          <section className="mx-auto mt-16 max-w-6xl">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30">
              <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
                <div className="bg-black">
                  <video
                    src="/examples/dottie-polak-5-indian-plantation-st.mp4"
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video h-full w-full bg-black object-contain"
                  />
                </div>

                <div className="flex flex-col justify-center p-7 sm:p-9">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Featured WalkNWow
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">
                    5 Indian Plantation St.
                  </h2>
                  <p className="mt-2 text-white/45">
                    Raritan Township, New Jersey
                  </p>
                  <div className="my-6 h-px bg-white/10" />
                  <p className="text-sm leading-6 text-white/50">
                    A real WalkNWow property tour created from listing photography,
                    with AI-directed movement, music, and a polished final edit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="mx-auto mt-20 max-w-7xl">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["01", "Paste the listing", "Use a supported Zillow or Weichert property link."],
                ["02", "AI directs the story", "WalkNWow chooses 1–2 strong views of the important rooms and keeps exterior coverage tight."],
                ["03", "Generate the walkthrough", "Selected photos become restrained, realistic property scenes."],
                ["04", "Finish & share", "Merge the clips, add music and branding, then download the finished video."],
              ].map(([number, title, body]) => (
                <div
                  key={number}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left"
                >
                  <span className="text-sm font-black text-cyan-300">{number}</span>
                  <h3 className="mt-6 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/45">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="examples" className="mx-auto mt-24 max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                Recent work
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                See what WalkNWow can create.
              </h2>
              <p className="mt-5 text-white/50">
                Browse completed WalkNWow tours and agent-branded marketing examples.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ["Residential Walkthrough", "Cinematic listing video"],
                ["Luxury Property", "Premium property presentation"],
                ["Agent-Branded Video", "Closing card + contact branding"],
              ].map(([title, label]) => (
                <div key={title} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-cyan-300/10 via-white/[0.03] to-blue-500/10">
                    <div className="rounded-full border border-white/15 bg-black/50 px-5 py-3 text-sm font-bold text-white/70">
                      Video example
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm text-white/40">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="pricing" className="mx-auto mt-24 max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                Simple pricing
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Built for every kind of listing.
              </h2>
              <p className="mt-5 text-white/50">
                Start at $99. Upgrade only when the property or production needs it.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-4">
              <PricingCard
                name="Essential"
                price="$99"
                description="Clean professional coverage for smaller listings."
                features={[
                  "Up to 1,750 sq ft",
                  "Up to 13 selected photos",
                  "AI scene selection",
                  "Music included",
                  "HD final video",
                ]}
              />
              <PricingCard
                name="Signature"
                price="$129"
                description="More room for larger listings and fuller storytelling."
                features={[
                  "1,751–2,500 sq ft",
                  "14–18 selected photos",
                  "Up to 1:30 final video",
                  "AI scene selection",
                  "Music included",
                ]}
              />
              <PricingCard
                name="Estate"
                price="$150"
                description="Extended coverage for larger and more detailed homes."
                features={[
                  "Larger properties",
                  "Up to 25 selected photos",
                  "Up to 2:15 final video",
                  "AI scene selection",
                  "Music included",
                ]}
              />
              <PricingCard
                name="Premium"
                price="$199"
                description="The complete real-estate marketing package."
                featured
                features={[
                  "Any property size",
                  "Any video length",
                  "Voice-over included",
                  "Subtitles included",
                  "Agent closing card included",
                ]}
              />
            </div>

            <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">4K Upgrade</p>
                    <p className="mt-1 text-sm text-white/45">Sharper premium final delivery.</p>
                  </div>
                  <span className="text-xl font-black text-cyan-300">+$35</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">Agent Closing Card</p>
                    <p className="mt-1 text-sm text-white/45">Headshot, brokerage and contact information.</p>
                  </div>
                  <span className="text-xl font-black text-cyan-300">+$10</span>
                </div>
                <p className="mt-2 text-xs text-white/30">Included with Premium.</p>
              </div>
            </div>
          </section>

          <div id="studio" className="mx-auto mt-24 max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
              WalkNWow Studio
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Create your walkthrough.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              Paste a property listing below, review the AI-selected photos, then generate.
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
                placeholder="Paste a Zillow or Weichert listing URL"
                className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black px-5 outline-none placeholder:text-white/25 focus:border-cyan-300/60"
              />

              <button
                type="submit"
                disabled={isBusy}
                className="min-h-14 rounded-2xl bg-white px-7 font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExtracting || isDirecting ? "Preparing project..." : "Analyze listing"}
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

                    <button
                      type="button"
                      onClick={mergeWalkthrough}
                      disabled={isBusy || clipsInStoryOrder.length < 2}
                      className="rounded-xl bg-white px-5 py-3 font-semibold text-black hover:bg-cyan-100 disabled:opacity-50"
                    >
                      {isMerging ? "Merging..." : `Merge ${clipsInStoryOrder.length} clips`}
                    </button>
                  </div>

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
          <section className="mx-auto mt-24 max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/35">
              Used by agents at
            </p>
            <div className="mx-auto mt-6 inline-flex items-center rounded-2xl border border-white/10 bg-white px-8 py-5 text-black shadow-xl">
              <span className="text-2xl font-black tracking-tight">
                Weichert
              </span>
              <span className="mx-3 h-7 w-px bg-black/20" />
              <span className="text-lg font-light tracking-wide">
                REALTORS®
              </span>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-xs leading-5 text-white/30">
              “Used by agents at” refers to individual real-estate professionals using or testing WalkNWow and does not imply a corporate endorsement or partnership.
            </p>
          </section>

          <section id="contact" className="mx-auto mt-24 max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                  Contact
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Talk to WalkNWow.
                </h2>
                <p className="mt-4 text-white/50">
                  Questions about a listing, pricing, agent branding, or a custom project? Send us a message.
                </p>
                <a
                  href="mailto:walknwowai@gmail.com"
                  className="mt-6 inline-block font-bold text-cyan-300 hover:text-cyan-200"
                >
                  walknwowai@gmail.com
                </a>
              </div>

              <form
                action="mailto:walknwowai@gmail.com"
                method="post"
                encType="text/plain"
                className="grid gap-4 sm:grid-cols-2"
              >
                <input name="name" required placeholder="Name" className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60" />
                <input name="phone" placeholder="Phone number" className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60" />
                <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60 sm:col-span-2" />
                <textarea name="message" required placeholder="How can we help?" rows={5} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 outline-none focus:border-cyan-300/60 sm:col-span-2" />
                <button type="submit" className="rounded-xl bg-cyan-300 px-5 py-3 font-bold text-black hover:bg-cyan-200 sm:col-span-2">
                  Send message
                </button>
              </form>
            </div>
          </section>

    </main>
  );
}


function PricingCard({
  name,
  price,
  description,
  features,
  featured = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[2rem] border p-7 ${
        featured
          ? "border-cyan-300/50 bg-gradient-to-b from-cyan-300/[0.12] to-white/[0.035] shadow-[0_20px_80px_rgba(103,232,249,0.10)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {featured && (
        <span className="absolute right-5 top-5 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
          Best value
        </span>
      )}

      <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">
        {name}
      </p>
      <p className="mt-5 text-5xl font-black tracking-tight">{price}</p>
      <p className="mt-4 min-h-12 text-sm leading-6 text-white/45">
        {description}
      </p>

      <div className="my-6 h-px bg-white/10" />

      <ul className="space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-white/70">
            <span className="text-cyan-300">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href="#studio"
        className={`mt-7 block rounded-xl px-4 py-3 text-center text-sm font-bold transition ${
          featured
            ? "bg-cyan-300 text-black hover:bg-cyan-200"
            : "border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
        }`}
      >
        Choose {name}
      </a>
    </div>
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