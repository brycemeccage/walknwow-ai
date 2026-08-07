import type { LensProfileKey } from "./lens-profiles";
import type { MovementProfileKey } from "./movement-profiles";

export type RoomProfile = {
  category: string;
  label: string;
  lens: LensProfileKey;
  movement: MovementProfileKey;
  durationSeconds: number;
  qualityRisk: "low" | "medium" | "high";
  preservationRules: string[];
};

const MAXIMUM_PRESERVATION = [
  "Do not add, remove, move, redesign, repaint, relight, restage, or invent anything.",
  "Preserve all architecture, furniture, fixtures, materials, colors, landscaping, reflections, and proportions exactly.",
  "Begin fully sharp and end on a stable fully sharp frame.",
];

export const ROOM_PROFILES: Record<string, RoomProfile> = {
  front_exterior: {
    category: "front_exterior",
    label: "Front Exterior",
    lens: "wide24",
    movement: "centeredApproach",
    durationSeconds: 4,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  rear_exterior: {
    category: "rear_exterior",
    label: "Rear Exterior",
    lens: "wide24",
    movement: "centeredApproach",
    durationSeconds: 3.5,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  aerial: {
    category: "aerial",
    label: "Aerial",
    lens: "wide24",
    movement: "aerialMicroGlide",
    durationSeconds: 4,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  entry: {
    category: "entry",
    label: "Entry",
    lens: "wide24",
    movement: "doorwayGlide",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  foyer: {
    category: "foyer",
    label: "Foyer",
    lens: "wide24",
    movement: "doorwayGlide",
    durationSeconds: 3.2,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  hallway: {
    category: "hallway",
    label: "Hallway",
    lens: "natural28",
    movement: "doorwayGlide",
    durationSeconds: 3,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  stairs: {
    category: "stairs",
    label: "Stairs",
    lens: "natural28",
    movement: "ultraStatic",
    durationSeconds: 2.8,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  living_room: {
    category: "living_room",
    label: "Living Room",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.5,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  family_room: {
    category: "family_room",
    label: "Family Room",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.5,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  kitchen: {
    category: "kitchen",
    label: "Kitchen",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.2,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  dining_room: {
    category: "dining_room",
    label: "Dining Room",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  office: {
    category: "office",
    label: "Office",
    lens: "natural28",
    movement: "microPush",
    durationSeconds: 3,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  primary_bedroom: {
    category: "primary_bedroom",
    label: "Primary Bedroom",
    lens: "wide24",
    movement: "doorwayGlide",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  bedroom: {
    category: "bedroom",
    label: "Bedroom",
    lens: "wide24",
    movement: "doorwayGlide",
    durationSeconds: 3,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  primary_bathroom: {
    category: "primary_bathroom",
    label: "Primary Bathroom",
    lens: "natural28",
    movement: "ultraStatic",
    durationSeconds: 2.8,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  bathroom: {
    category: "bathroom",
    label: "Bathroom",
    lens: "natural28",
    movement: "ultraStatic",
    durationSeconds: 2.8,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  laundry: {
    category: "laundry",
    label: "Laundry",
    lens: "natural28",
    movement: "microPush",
    durationSeconds: 2.8,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  basement: {
    category: "basement",
    label: "Basement",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  garage: {
    category: "garage",
    label: "Garage",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  gym: {
    category: "gym",
    label: "Gym",
    lens: "wide24",
    movement: "ultraStatic",
    durationSeconds: 3,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  theater: {
    category: "theater",
    label: "Theater",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  game_room: {
    category: "game_room",
    label: "Game Room",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  wine_cellar: {
    category: "wine_cellar",
    label: "Wine Cellar",
    lens: "detail35",
    movement: "ultraStatic",
    durationSeconds: 2.8,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  guest_house: {
    category: "guest_house",
    label: "Guest House",
    lens: "wide24",
    movement: "doorwayGlide",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  patio_deck: {
    category: "patio_deck",
    label: "Patio or Deck",
    lens: "wide24",
    movement: "outdoorGlide",
    durationSeconds: 3.2,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  backyard: {
    category: "backyard",
    label: "Backyard",
    lens: "wide24",
    movement: "outdoorGlide",
    durationSeconds: 3.5,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  pool: {
    category: "pool",
    label: "Pool",
    lens: "wide24",
    movement: "outdoorGlide",
    durationSeconds: 3.5,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  outdoor_kitchen: {
    category: "outdoor_kitchen",
    label: "Outdoor Kitchen",
    lens: "wide24",
    movement: "ultraStatic",
    durationSeconds: 3,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  fire_pit: {
    category: "fire_pit",
    label: "Fire Pit",
    lens: "natural28",
    movement: "microPush",
    durationSeconds: 3,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  dock: {
    category: "dock",
    label: "Dock",
    lens: "wide24",
    movement: "outdoorGlide",
    durationSeconds: 3.5,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  view: {
    category: "view",
    label: "View",
    lens: "wide24",
    movement: "outdoorGlide",
    durationSeconds: 3.5,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  detail: {
    category: "detail",
    label: "Detail",
    lens: "detail35",
    movement: "ultraStatic",
    durationSeconds: 2.6,
    qualityRisk: "high",
    preservationRules: MAXIMUM_PRESERVATION,
  },

  other: {
    category: "other",
    label: "Property Scene",
    lens: "wide24",
    movement: "microPush",
    durationSeconds: 3,
    qualityRisk: "medium",
    preservationRules: MAXIMUM_PRESERVATION,
  },
};

export function getRoomProfile(
  category: string
): RoomProfile {
  return ROOM_PROFILES[category] ?? ROOM_PROFILES.other;
}
