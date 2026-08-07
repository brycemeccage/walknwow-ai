import type {
  LuxuryEditorTimeline,
  EditedScene,
} from "./luxury-editor";
import type {
  RealtorOutroLayout,
} from "./realtor-outro";
import type {
  ExportSettings,
} from "./export-engine";

export type MusicPlan = {
  trackId: string;
  trackUrl: string;
  durationSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  baseVolume: number;
  outroVolume: number;
  loop: boolean;
  beatMarkers?: number[];
};

export type RenderPipelineInput = {
  timeline: LuxuryEditorTimeline;
  music?: MusicPlan;
  outro?: RealtorOutroLayout;
  exportSettings: ExportSettings;
};

export type RenderSegment =
  | {
      type: "video";
      sceneId: string;
      sourceUrl: string;
      startSeconds: number;
      durationSeconds: number;
      fadeInSeconds: number;
      fadeOutSeconds: number;
      transitionInSeconds: number;
      transitionOutSeconds: number;
      order: number;
    }
  | {
      type: "outro";
      startSeconds: number;
      durationSeconds: number;
      fadeInSeconds: number;
      fadeOutSeconds: number;
      layout: RealtorOutroLayout;
    };

export type AudioSegment = {
  type: "music";
  trackId: string;
  sourceUrl: string;
  startSeconds: number;
  durationSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  baseVolume: number;
  outroVolume: number;
  duckStartSeconds?: number;
  duckEndSeconds?: number;
  loop: boolean;
};

export type RenderPipelinePlan = {
  version: "walknwow-render-v1";
  videoSegments: RenderSegment[];
  audioSegments: AudioSegment[];
  totalDurationSeconds: number;
  openingFadeSeconds: number;
  endingFadeSeconds: number;
  crossfadeSeconds: number;
  exportSettings: ExportSettings;
  warnings: string[];
};

function round(
  value: number
): number {
  return Number(value.toFixed(2));
}

function buildVideoSegments(
  scenes: EditedScene[],
  openingFadeSeconds: number,
  endingFadeSeconds: number,
  crossfadeSeconds: number
): {
  segments: RenderSegment[];
  endTime: number;
} {
  const segments: RenderSegment[] = [];
  let cursor = 0;

  scenes.forEach((scene, index) => {
    const transitionInSeconds =
      index === 0
        ? 0
        : crossfadeSeconds;

    const transitionOutSeconds =
      index === scenes.length - 1
        ? 0
        : crossfadeSeconds;

    const fadeInSeconds =
      index === 0
        ? openingFadeSeconds
        : transitionInSeconds;

    const fadeOutSeconds =
      index === scenes.length - 1
        ? endingFadeSeconds
        : transitionOutSeconds;

    const startSeconds =
      index === 0
        ? 0
        : cursor - transitionInSeconds;

    segments.push({
      type: "video",
      sceneId: scene.id,
      sourceUrl: scene.videoUrl,
      startSeconds: round(startSeconds),
      durationSeconds: round(
        scene.durationSeconds
      ),
      fadeInSeconds: round(
        fadeInSeconds
      ),
      fadeOutSeconds: round(
        fadeOutSeconds
      ),
      transitionInSeconds: round(
        transitionInSeconds
      ),
      transitionOutSeconds: round(
        transitionOutSeconds
      ),
      order: index + 1,
    });

    cursor =
      startSeconds +
      scene.durationSeconds;
  });

  return {
    segments,
    endTime: round(cursor),
  };
}

function appendOutro(
  segments: RenderSegment[],
  startSeconds: number,
  outro?: RealtorOutroLayout
): {
  segments: RenderSegment[];
  endTime: number;
} {
  if (!outro) {
    return {
      segments,
      endTime: startSeconds,
    };
  }

  const outroStart = startSeconds;

  const outroSegment: RenderSegment = {
    type: "outro",
    startSeconds: round(outroStart),
    durationSeconds: round(
      outro.durationSeconds
    ),
    fadeInSeconds: round(
      outro.fadeInSeconds
    ),
    fadeOutSeconds: round(
      outro.fadeOutSeconds
    ),
    layout: outro,
  };

  return {
    segments: [
      ...segments,
      outroSegment,
    ],
    endTime: round(
      outroStart +
        outro.durationSeconds
    ),
  };
}

function buildAudioSegments(
  music: MusicPlan | undefined,
  totalDurationSeconds: number,
  outroStartSeconds?: number
): AudioSegment[] {
  if (
    !music ||
    !music.trackUrl.trim()
  ) {
    return [];
  }

  const duckStartSeconds =
    typeof outroStartSeconds === "number"
      ? round(outroStartSeconds)
      : undefined;

  const duckEndSeconds =
    typeof outroStartSeconds === "number"
      ? round(totalDurationSeconds)
      : undefined;

  return [
    {
      type: "music",
      trackId: music.trackId,
      sourceUrl: music.trackUrl,
      startSeconds: 0,
      durationSeconds: round(
        totalDurationSeconds
      ),
      fadeInSeconds: round(
        music.fadeInSeconds
      ),
      fadeOutSeconds: round(
        music.fadeOutSeconds
      ),
      baseVolume: music.baseVolume,
      outroVolume: music.outroVolume,
      duckStartSeconds,
      duckEndSeconds,
      loop:
        music.loop ||
        music.durationSeconds <
          totalDurationSeconds,
    },
  ];
}

function validatePlan(
  input: RenderPipelineInput
): string[] {
  const warnings: string[] = [];

  if (
    input.timeline.activeScenes.length === 0
  ) {
    warnings.push(
      "The render plan contains no active video scenes."
    );
  }

  if (
    input.timeline.activeScenes.length === 1
  ) {
    warnings.push(
      "Only one active scene is available, so crossfades will not be used."
    );
  }

  if (
    !input.music?.trackUrl
  ) {
    warnings.push(
      "No music track was provided."
    );
  }

  if (!input.outro) {
    warnings.push(
      "No realtor outro was provided."
    );
  }

  return warnings;
}

export function buildRenderPipeline(
  input: RenderPipelineInput
): RenderPipelinePlan {
  const warnings =
    validatePlan(input);

  const videoBuild =
    buildVideoSegments(
      input.timeline.activeScenes,
      input.timeline.openingFadeSeconds,
      input.timeline.endingFadeSeconds,
      input.timeline.defaultCrossfadeSeconds
    );

  const outroStartSeconds =
    input.outro
      ? videoBuild.endTime
      : undefined;

  const withOutro =
    appendOutro(
      videoBuild.segments,
      videoBuild.endTime,
      input.outro
    );

  const totalDurationSeconds =
    withOutro.endTime;

  const audioSegments =
    buildAudioSegments(
      input.music,
      totalDurationSeconds,
      outroStartSeconds
    );

  return {
    version: "walknwow-render-v1",
    videoSegments:
      withOutro.segments,
    audioSegments,
    totalDurationSeconds:
      round(totalDurationSeconds),
    openingFadeSeconds:
      input.timeline
        .openingFadeSeconds,
    endingFadeSeconds:
      input.timeline
        .endingFadeSeconds,
    crossfadeSeconds:
      input.timeline
        .defaultCrossfadeSeconds,
    exportSettings:
      input.exportSettings,
    warnings,
  };
}

export function summarizeRenderPipeline(
  plan: RenderPipelinePlan
) {
  return {
    version: plan.version,
    sceneCount:
      plan.videoSegments.filter(
        (segment) =>
          segment.type === "video"
      ).length,
    hasOutro:
      plan.videoSegments.some(
        (segment) =>
          segment.type === "outro"
      ),
    hasMusic:
      plan.audioSegments.length > 0,
    totalDurationSeconds:
      plan.totalDurationSeconds,
    resolution:
      `${plan.exportSettings.width}x${plan.exportSettings.height}`,
    preset:
      plan.exportSettings.preset,
    warnings:
      plan.warnings,
  };
}