export type ExportPreset =
  | "express"
  | "standard"
  | "luxury"
  | "ultra";

export type ExportAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1";

export type ExportCodec =
  | "h264"
  | "hevc";

export type ExportEngineInput = {
  preset: ExportPreset;
  aspectRatio: ExportAspectRatio;
  codec?: ExportCodec;
  durationSeconds: number;
  includeOpeningFade?: boolean;
  includeMusic?: boolean;
  includeCrossfades?: boolean;
  includeRealtorOutro?: boolean;
};

export type ExportSettings = {
  preset: ExportPreset;
  aspectRatio: ExportAspectRatio;
  codec: ExportCodec;
  width: number;
  height: number;
  fps: number;
  videoBitrateMbps: number;
  audioBitrateKbps: number;
  pixelFormat: string;
  container: "mp4";
  includeOpeningFade: boolean;
  includeMusic: boolean;
  includeCrossfades: boolean;
  includeRealtorOutro: boolean;
  estimatedFileSizeMb: number;
  estimatedRenderTimeSeconds: number;
  ffmpegVideoCodec: string;
  ffmpegAudioCodec: string;
  ffmpegArguments: string[];
};

type ResolutionProfile = {
  width: number;
  height: number;
  fps: number;
  h264BitrateMbps: number;
  hevcBitrateMbps: number;
  renderMultiplier: number;
};

const RESOLUTION_PROFILES: Record<
  ExportPreset,
  ResolutionProfile
> = {
  express: {
    width: 1280,
    height: 720,
    fps: 30,
    h264BitrateMbps: 6,
    hevcBitrateMbps: 4,
    renderMultiplier: 0.45,
  },
  standard: {
    width: 1920,
    height: 1080,
    fps: 30,
    h264BitrateMbps: 12,
    hevcBitrateMbps: 8,
    renderMultiplier: 0.8,
  },
  luxury: {
    width: 2560,
    height: 1440,
    fps: 30,
    h264BitrateMbps: 20,
    hevcBitrateMbps: 13,
    renderMultiplier: 1.25,
  },
  ultra: {
    width: 3840,
    height: 2160,
    fps: 30,
    h264BitrateMbps: 36,
    hevcBitrateMbps: 24,
    renderMultiplier: 2.2,
  },
};

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function dimensionsForAspectRatio(
  profile: ResolutionProfile,
  aspectRatio: ExportAspectRatio
): {
  width: number;
  height: number;
} {
  if (aspectRatio === "9:16") {
    return {
      width: profile.height,
      height: profile.width,
    };
  }

  if (aspectRatio === "1:1") {
    const size = Math.min(
      profile.width,
      profile.height
    );

    return {
      width: size,
      height: size,
    };
  }

  return {
    width: profile.width,
    height: profile.height,
  };
}

function estimateFileSizeMb(args: {
  durationSeconds: number;
  videoBitrateMbps: number;
  audioBitrateKbps: number;
}): number {
  const videoMegabits =
    args.durationSeconds *
    args.videoBitrateMbps;

  const audioMegabits =
    args.durationSeconds *
    (args.audioBitrateKbps / 1000);

  const totalMegabytes =
    (videoMegabits +
      audioMegabits) /
    8;

  return Number(
    (totalMegabytes * 1.04).toFixed(1)
  );
}

function estimateRenderTimeSeconds(args: {
  durationSeconds: number;
  renderMultiplier: number;
  includeMusic: boolean;
  includeCrossfades: boolean;
  includeRealtorOutro: boolean;
}): number {
  let multiplier =
    args.renderMultiplier;

  if (args.includeMusic) {
    multiplier += 0.08;
  }

  if (args.includeCrossfades) {
    multiplier += 0.15;
  }

  if (args.includeRealtorOutro) {
    multiplier += 0.12;
  }

  return Math.max(
    5,
    Math.round(
      args.durationSeconds *
        multiplier
    )
  );
}

function buildFfmpegArguments(args: {
  codec: ExportCodec;
  width: number;
  height: number;
  fps: number;
  videoBitrateMbps: number;
  audioBitrateKbps: number;
}): string[] {
  const videoCodec =
    args.codec === "hevc"
      ? "libx265"
      : "libx264";

  const pixelFormat =
    args.codec === "hevc"
      ? "yuv420p10le"
      : "yuv420p";

  return [
    "-c:v",
    videoCodec,
    "-preset",
    args.codec === "hevc"
      ? "medium"
      : "slow",
    "-b:v",
    `${args.videoBitrateMbps}M`,
    "-maxrate",
    `${Number(
      (
        args.videoBitrateMbps *
        1.25
      ).toFixed(1)
    )}M`,
    "-bufsize",
    `${Number(
      (
        args.videoBitrateMbps *
        2
      ).toFixed(1)
    )}M`,
    "-r",
    String(args.fps),
    "-vf",
    `scale=${args.width}:${args.height}:force_original_aspect_ratio=decrease,pad=${args.width}:${args.height}:(ow-iw)/2:(oh-ih)/2`,
    "-pix_fmt",
    pixelFormat,
    "-c:a",
    "aac",
    "-b:a",
    `${args.audioBitrateKbps}k`,
    "-movflags",
    "+faststart",
  ];
}

export function buildExportSettings(
  input: ExportEngineInput
): ExportSettings {
  const preset =
    input.preset in
    RESOLUTION_PROFILES
      ? input.preset
      : "standard";

  const profile =
    RESOLUTION_PROFILES[preset];

  const aspectRatio =
    input.aspectRatio === "9:16" ||
    input.aspectRatio === "1:1"
      ? input.aspectRatio
      : "16:9";

  const codec =
    input.codec === "hevc"
      ? "hevc"
      : "h264";

  const dimensions =
    dimensionsForAspectRatio(
      profile,
      aspectRatio
    );

  const includeOpeningFade =
    input.includeOpeningFade !== false;

  const includeMusic =
    input.includeMusic !== false;

  const includeCrossfades =
    input.includeCrossfades !== false;

  const includeRealtorOutro =
    input.includeRealtorOutro !== false;

  const durationSeconds =
    clamp(
      Number.isFinite(
        input.durationSeconds
      )
        ? input.durationSeconds
        : 60,
      1,
      3600
    );

  const videoBitrateMbps =
    codec === "hevc"
      ? profile.hevcBitrateMbps
      : profile.h264BitrateMbps;

  const audioBitrateKbps =
    preset === "express"
      ? 160
      : 192;

  const ffmpegArguments =
    buildFfmpegArguments({
      codec,
      width:
        dimensions.width,
      height:
        dimensions.height,
      fps: profile.fps,
      videoBitrateMbps,
      audioBitrateKbps,
    });

  return {
    preset,
    aspectRatio,
    codec,
    width: dimensions.width,
    height: dimensions.height,
    fps: profile.fps,
    videoBitrateMbps,
    audioBitrateKbps,
    pixelFormat:
      codec === "hevc"
        ? "yuv420p10le"
        : "yuv420p",
    container: "mp4",
    includeOpeningFade,
    includeMusic,
    includeCrossfades,
    includeRealtorOutro,
    estimatedFileSizeMb:
      estimateFileSizeMb({
        durationSeconds,
        videoBitrateMbps,
        audioBitrateKbps,
      }),
    estimatedRenderTimeSeconds:
      estimateRenderTimeSeconds({
        durationSeconds,
        renderMultiplier:
          profile.renderMultiplier,
        includeMusic,
        includeCrossfades,
        includeRealtorOutro,
      }),
    ffmpegVideoCodec:
      codec === "hevc"
        ? "libx265"
        : "libx264",
    ffmpegAudioCodec: "aac",
    ffmpegArguments,
  };
}

export function getExportPresetSummary() {
  return {
    express: {
      label: "Express",
      resolution: "720p",
      width: 1280,
      height: 720,
    },
    standard: {
      label: "Standard",
      resolution: "1080p",
      width: 1920,
      height: 1080,
    },
    luxury: {
      label: "Luxury",
      resolution: "1440p / 2K",
      width: 2560,
      height: 1440,
    },
    ultra: {
      label: "Ultra",
      resolution: "4K",
      width: 3840,
      height: 2160,
    },
  } as const;
}