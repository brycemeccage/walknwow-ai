export type OutroTheme =
  | "dark"
  | "light";

export type OutroAspectRatio =
  | "16:9"
  | "9:16";

export type RealtorOutroInput = {
  realtorName: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  brokerageName?: string;
  brokerageLogoUrl?: string;
  headshotUrl?: string;
  qrCodeUrl?: string;
  callToAction?: string;
  theme?: OutroTheme;
  aspectRatio?: OutroAspectRatio;
};

export type RealtorOutroLayout = {
  width: number;
  height: number;
  durationSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  musicVolume: number;
  theme: OutroTheme;
  aspectRatio: OutroAspectRatio;
  text: {
    realtorName: string;
    title: string;
    phone: string;
    email: string;
    website: string;
    brokerageName: string;
    callToAction: string;
  };
  media: {
    brokerageLogoUrl: string;
    headshotUrl: string;
    qrCodeUrl: string;
  };
  positions: {
    headshot: Box;
    logo: Box;
    name: TextBox;
    title: TextBox;
    contact: TextBox;
    cta: TextBox;
    qr: Box;
  };
  colors: {
    background: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
  };
};

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextBox = Box & {
  fontSize: number;
  align:
    | "left"
    | "center"
    | "right";
};

const DEFAULT_DURATION_SECONDS = 6;
const DEFAULT_FADE_IN_SECONDS = 1;
const DEFAULT_FADE_OUT_SECONDS = 1;
const DEFAULT_MUSIC_VOLUME = 0.3;

function clean(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : fallback;
}

function getCanvas(
  aspectRatio: OutroAspectRatio
): {
  width: number;
  height: number;
} {
  return aspectRatio === "9:16"
    ? {
        width: 1080,
        height: 1920,
      }
    : {
        width: 1920,
        height: 1080,
      };
}

function getColors(
  theme: OutroTheme
) {
  if (theme === "light") {
    return {
      background: "#F7F4EE",
      primaryText: "#121212",
      secondaryText: "#555555",
      accent: "#0EA5E9",
    };
  }

  return {
    background: "#07090C",
    primaryText: "#FFFFFF",
    secondaryText: "#B8C0CC",
    accent: "#67E8F9",
  };
}

function buildLandscapePositions(): RealtorOutroLayout["positions"] {
  return {
    headshot: {
      x: 140,
      y: 190,
      width: 420,
      height: 700,
    },
    logo: {
      x: 1420,
      y: 90,
      width: 320,
      height: 140,
    },
    name: {
      x: 650,
      y: 260,
      width: 960,
      height: 110,
      fontSize: 72,
      align: "left",
    },
    title: {
      x: 650,
      y: 380,
      width: 960,
      height: 70,
      fontSize: 36,
      align: "left",
    },
    contact: {
      x: 650,
      y: 500,
      width: 960,
      height: 210,
      fontSize: 34,
      align: "left",
    },
    cta: {
      x: 650,
      y: 770,
      width: 760,
      height: 90,
      fontSize: 40,
      align: "left",
    },
    qr: {
      x: 1500,
      y: 700,
      width: 220,
      height: 220,
    },
  };
}

function buildVerticalPositions(): RealtorOutroLayout["positions"] {
  return {
    headshot: {
      x: 240,
      y: 190,
      width: 600,
      height: 760,
    },
    logo: {
      x: 280,
      y: 70,
      width: 520,
      height: 130,
    },
    name: {
      x: 100,
      y: 1020,
      width: 880,
      height: 110,
      fontSize: 66,
      align: "center",
    },
    title: {
      x: 120,
      y: 1140,
      width: 840,
      height: 70,
      fontSize: 34,
      align: "center",
    },
    contact: {
      x: 100,
      y: 1270,
      width: 880,
      height: 250,
      fontSize: 32,
      align: "center",
    },
    cta: {
      x: 100,
      y: 1580,
      width: 880,
      height: 100,
      fontSize: 38,
      align: "center",
    },
    qr: {
      x: 410,
      y: 1700,
      width: 260,
      height: 260,
    },
  };
}

export function buildRealtorOutro(
  input: RealtorOutroInput
): RealtorOutroLayout {
  const theme =
    input.theme === "light"
      ? "light"
      : "dark";

  const aspectRatio =
    input.aspectRatio === "9:16"
      ? "9:16"
      : "16:9";

  const canvas =
    getCanvas(aspectRatio);

  const positions =
    aspectRatio === "9:16"
      ? buildVerticalPositions()
      : buildLandscapePositions();

  return {
    width: canvas.width,
    height: canvas.height,
    durationSeconds:
      DEFAULT_DURATION_SECONDS,
    fadeInSeconds:
      DEFAULT_FADE_IN_SECONDS,
    fadeOutSeconds:
      DEFAULT_FADE_OUT_SECONDS,
    musicVolume:
      DEFAULT_MUSIC_VOLUME,
    theme,
    aspectRatio,
    text: {
      realtorName:
        clean(
          input.realtorName,
          "Realtor Name"
        ),
      title:
        clean(
          input.title,
          "Real Estate Professional"
        ),
      phone:
        clean(input.phone),
      email:
        clean(input.email),
      website:
        clean(input.website),
      brokerageName:
        clean(input.brokerageName),
      callToAction:
        clean(
          input.callToAction,
          "Schedule Your Private Tour"
        ),
    },
    media: {
      brokerageLogoUrl:
        clean(
          input.brokerageLogoUrl
        ),
      headshotUrl:
        clean(input.headshotUrl),
      qrCodeUrl:
        clean(input.qrCodeUrl),
    },
    positions,
    colors:
      getColors(theme),
  };
}

export function getRealtorOutroDefaults() {
  return {
    durationSeconds:
      DEFAULT_DURATION_SECONDS,
    fadeInSeconds:
      DEFAULT_FADE_IN_SECONDS,
    fadeOutSeconds:
      DEFAULT_FADE_OUT_SECONDS,
    musicVolume:
      DEFAULT_MUSIC_VOLUME,
    supportedThemes: [
      "dark",
      "light",
    ] as const,
    supportedAspectRatios: [
      "16:9",
      "9:16",
    ] as const,
  };
}