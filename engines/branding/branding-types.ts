export type RealtorBranding = {
  realtorName: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  brokerageName?: string;
  logoUrl?: string;
  headshotUrl?: string;
  qrCodeUrl?: string;
  callToAction?: string;
};

export type OutroPlan = {
  durationSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  branding: RealtorBranding;
};
