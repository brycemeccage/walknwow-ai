export type CameraProfileKey =
  | "heroExterior"
  | "aerial"
  | "entry"
  | "foyer"
  | "hallway"
  | "stairs"
  | "livingRoom"
  | "familyRoom"
  | "kitchenReveal"
  | "diningRoom"
  | "office"
  | "primaryBedroom"
  | "bedroom"
  | "primaryBathroom"
  | "bathroom"
  | "laundry"
  | "basement"
  | "garage"
  | "gym"
  | "theater"
  | "gameRoom"
  | "wineCellar"
  | "guestHouse"
  | "patioDeck"
  | "backyard"
  | "pool"
  | "outdoorKitchen"
  | "firePit"
  | "dock"
  | "view"
  | "rearExterior"
  | "detail"
  | "default";

export type CameraProfile = {
  key: CameraProfileKey;
  label: string;
  lens: string;
  movement: string;
  motionBudget: number;
  durationSeconds: number;
  openingInstruction: string;
  endingInstruction: string;
  preservationPriority: "maximum" | "very_high" | "high";
  qualityRisk: "low" | "medium" | "high";
};

export const CAMERA_PROFILES: Record<
  CameraProfileKey,
  CameraProfile
> = {
  heroExterior: {
    key: "heroExterior",
    label: "Hero Exterior",
    lens: "24mm equivalent",
    movement:
      "Extremely slow centered forward micro-approach toward the property.",
    motionBudget: 0.035,
    durationSeconds: 4,
    openingInstruction:
      "Begin fully sharp on the original composition with no focus settling.",
    endingInstruction:
      "End on a stable locked frame for a soft dissolve.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  aerial: {
    key: "aerial",
    label: "Aerial Establishing",
    lens: "24mm equivalent",
    movement:
      "Almost-static forward aerial micro-glide with no rotation or altitude change.",
    motionBudget: 0.03,
    durationSeconds: 4,
    openingInstruction:
      "Begin sharp with the roofline, lot, trees, roads, and horizon fully stable.",
    endingInstruction:
      "Finish with no motion spike and a level horizon.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  entry: {
    key: "entry",
    label: "Entry Reveal",
    lens: "24mm equivalent",
    movement:
      "Tiny centered doorway micro-glide with no lateral movement.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with the doorway and trim perfectly aligned.",
    endingInstruction:
      "Settle on a stable frame that leads naturally into the interior.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  foyer: {
    key: "foyer",
    label: "Foyer Reveal",
    lens: "24mm equivalent",
    movement:
      "Subtle straight micro-push through the center of the foyer.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with railings, trim, flooring, and wall lines locked.",
    endingInstruction:
      "Finish centered and stable for the next interior scene.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  hallway: {
    key: "hallway",
    label: "Hallway Transition",
    lens: "24mm equivalent",
    movement:
      "Very restrained forward hallway micro-glide.",
    motionBudget: 0.018,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with door frames and floor lines straight.",
    endingInstruction:
      "Finish on a stable centered frame.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  stairs: {
    key: "stairs",
    label: "Stair Detail",
    lens: "28mm equivalent",
    movement:
      "Almost perfectly still shot with only a tiny forward micro-push.",
    motionBudget: 0.008,
    durationSeconds: 2.8,
    openingInstruction:
      "Begin fully sharp with every stair, spindle, and railing line unchanged.",
    endingInstruction:
      "End completely stable.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  livingRoom: {
    key: "livingRoom",
    label: "Living Room Reveal",
    lens: "24mm equivalent",
    movement:
      "Very subtle forward gimbal micro-glide toward the room focal point.",
    motionBudget: 0.025,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin sharp with furniture, windows, fireplace, and ceiling lines fixed.",
    endingInstruction:
      "Settle into a stable hero frame.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  familyRoom: {
    key: "familyRoom",
    label: "Family Room Reveal",
    lens: "24mm equivalent",
    movement:
      "Restrained forward micro-glide with almost no perspective change.",
    motionBudget: 0.025,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin fully sharp and preserve every furniture position.",
    endingInstruction:
      "Finish on a stable wide composition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  kitchenReveal: {
    key: "kitchenReveal",
    label: "Kitchen Reveal",
    lens: "24mm equivalent",
    movement:
      "Almost-static centered micro-push toward the island or main cabinetry.",
    motionBudget: 0.015,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with cabinets, counters, appliances, backsplash, and island edges locked.",
    endingInstruction:
      "End on a stable centered frame with no cabinet or appliance drift.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  diningRoom: {
    key: "diningRoom",
    label: "Dining Room Reveal",
    lens: "24mm equivalent",
    movement:
      "Tiny forward micro-glide toward the dining table.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with table, chairs, lighting, and windows fixed.",
    endingInstruction:
      "Finish in a stable balanced composition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  office: {
    key: "office",
    label: "Office Reveal",
    lens: "28mm equivalent",
    movement:
      "Subtle centered micro-push toward the desk or focal wall.",
    motionBudget: 0.018,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with shelves, monitors, desks, and windows unchanged.",
    endingInstruction:
      "Finish steady and centered.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  primaryBedroom: {
    key: "primaryBedroom",
    label: "Primary Bedroom Reveal",
    lens: "24mm equivalent",
    movement:
      "Tiny doorway-style micro-glide toward the bed or room focal point.",
    motionBudget: 0.018,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with bed, furniture, windows, curtains, and walls fixed.",
    endingInstruction:
      "Finish on a calm stable composition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  bedroom: {
    key: "bedroom",
    label: "Bedroom Reveal",
    lens: "24mm equivalent",
    movement:
      "Very restrained doorway micro-glide with no lateral shift.",
    motionBudget: 0.015,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with furniture and wall geometry unchanged.",
    endingInstruction:
      "Finish on a stable centered frame.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  primaryBathroom: {
    key: "primaryBathroom",
    label: "Primary Bathroom Detail",
    lens: "28mm equivalent",
    movement:
      "Almost perfectly still micro-push.",
    motionBudget: 0.006,
    durationSeconds: 2.8,
    openingInstruction:
      "Begin fully sharp with mirrors, glass, tile, vanities, and fixtures unchanged.",
    endingInstruction:
      "End completely stable with reflections consistent.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  bathroom: {
    key: "bathroom",
    label: "Bathroom Detail",
    lens: "28mm equivalent",
    movement:
      "Almost-static forward micro-push.",
    motionBudget: 0.006,
    durationSeconds: 2.8,
    openingInstruction:
      "Begin fully sharp with mirrors, tile, glass, and fixtures locked.",
    endingInstruction:
      "End completely stable.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  laundry: {
    key: "laundry",
    label: "Laundry Room",
    lens: "28mm equivalent",
    movement:
      "Tiny centered micro-push.",
    motionBudget: 0.012,
    durationSeconds: 2.8,
    openingInstruction:
      "Begin sharp with appliances, cabinets, counters, and doors fixed.",
    endingInstruction:
      "Finish stable and centered.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  basement: {
    key: "basement",
    label: "Basement Reveal",
    lens: "24mm equivalent",
    movement:
      "Subtle forward micro-glide.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with walls, flooring, furniture, and stairs unchanged.",
    endingInstruction:
      "Finish on a stable wide frame.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  garage: {
    key: "garage",
    label: "Garage Reveal",
    lens: "24mm equivalent",
    movement:
      "Very subtle centered forward glide.",
    motionBudget: 0.018,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with doors, shelving, vehicles, and floor lines fixed.",
    endingInstruction:
      "Finish stable with all objects stationary.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  gym: {
    key: "gym",
    label: "Gym Reveal",
    lens: "24mm equivalent",
    movement:
      "Tiny forward micro-glide.",
    motionBudget: 0.018,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with equipment, mirrors, flooring, and walls unchanged.",
    endingInstruction:
      "Finish stable and centered.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  theater: {
    key: "theater",
    label: "Theater Reveal",
    lens: "24mm equivalent",
    movement:
      "Slow restrained micro-glide toward the screen or seating.",
    motionBudget: 0.018,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with seats, screen, lighting, and walls fixed.",
    endingInstruction:
      "Finish on a stable cinematic frame.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  gameRoom: {
    key: "gameRoom",
    label: "Game Room Reveal",
    lens: "24mm equivalent",
    movement:
      "Subtle forward micro-glide.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with tables, games, lighting, and decor fixed.",
    endingInstruction:
      "Finish stable and centered.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  wineCellar: {
    key: "wineCellar",
    label: "Wine Cellar Detail",
    lens: "28mm equivalent",
    movement:
      "Almost-static micro-push.",
    motionBudget: 0.008,
    durationSeconds: 2.8,
    openingInstruction:
      "Begin sharp with racks, bottles, lighting, and walls unchanged.",
    endingInstruction:
      "End completely stable.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  guestHouse: {
    key: "guestHouse",
    label: "Guest House Reveal",
    lens: "24mm equivalent",
    movement:
      "Restrained doorway-style micro-glide.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with furniture, windows, doors, and finishes unchanged.",
    endingInstruction:
      "Finish on a stable wide frame.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  patioDeck: {
    key: "patioDeck",
    label: "Patio or Deck Reveal",
    lens: "24mm equivalent",
    movement:
      "Very subtle forward outdoor micro-glide.",
    motionBudget: 0.02,
    durationSeconds: 3.2,
    openingInstruction:
      "Begin sharp with patio edges, furniture, railings, and horizon stable.",
    endingInstruction:
      "Finish stable for a soft outdoor transition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  backyard: {
    key: "backyard",
    label: "Backyard Reveal",
    lens: "24mm equivalent",
    movement:
      "Restrained forward micro-glide with a locked horizon.",
    motionBudget: 0.025,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin sharp with landscaping, fences, structures, and horizon unchanged.",
    endingInstruction:
      "Finish on a stable wide composition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  pool: {
    key: "pool",
    label: "Pool Reveal",
    lens: "24mm equivalent",
    movement:
      "Slow restrained forward poolside micro-glide.",
    motionBudget: 0.02,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin sharp with pool shape, waterline, deck edges, fences, and landscaping fixed.",
    endingInstruction:
      "Finish stable with the pool geometry unchanged.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  outdoorKitchen: {
    key: "outdoorKitchen",
    label: "Outdoor Kitchen Reveal",
    lens: "24mm equivalent",
    movement:
      "Almost-static micro-push toward the counters or grill.",
    motionBudget: 0.012,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with counters, appliances, cabinetry, and patio lines fixed.",
    endingInstruction:
      "Finish completely stable.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  firePit: {
    key: "firePit",
    label: "Fire Pit Reveal",
    lens: "28mm equivalent",
    movement:
      "Tiny forward micro-push.",
    motionBudget: 0.012,
    durationSeconds: 3,
    openingInstruction:
      "Begin sharp with seating, hardscape, landscaping, and fire feature unchanged.",
    endingInstruction:
      "Finish stable and centered.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  dock: {
    key: "dock",
    label: "Dock Reveal",
    lens: "24mm equivalent",
    movement:
      "Very restrained forward micro-glide with no horizon drift.",
    motionBudget: 0.02,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin sharp with dock edges, waterline, railings, and horizon stable.",
    endingInstruction:
      "Finish on a stable wide frame.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  view: {
    key: "view",
    label: "View Reveal",
    lens: "24mm equivalent",
    movement:
      "Almost-static forward micro-glide with a locked horizon.",
    motionBudget: 0.015,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin fully sharp with the horizon, terrain, trees, water, and structures stable.",
    endingInstruction:
      "Finish completely stable for a closing dissolve.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  rearExterior: {
    key: "rearExterior",
    label: "Rear Exterior",
    lens: "24mm equivalent",
    movement:
      "Extremely slow centered micro-approach.",
    motionBudget: 0.025,
    durationSeconds: 3.5,
    openingInstruction:
      "Begin sharp with siding, roof, doors, windows, landscaping, and horizon locked.",
    endingInstruction:
      "Finish on a stable exterior composition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },

  detail: {
    key: "detail",
    label: "Architectural Detail",
    lens: "35mm equivalent",
    movement:
      "Almost perfectly still cinematic micro-push.",
    motionBudget: 0.004,
    durationSeconds: 2.6,
    openingInstruction:
      "Begin fully sharp with every material, line, and repeated pattern fixed.",
    endingInstruction:
      "End completely stable.",
    preservationPriority: "maximum",
    qualityRisk: "high",
  },

  default: {
    key: "default",
    label: "Default Property Scene",
    lens: "24mm equivalent",
    movement:
      "Almost-static stabilized forward micro-glide.",
    motionBudget: 0.015,
    durationSeconds: 3,
    openingInstruction:
      "Begin fully sharp and preserve the source image exactly.",
    endingInstruction:
      "Finish on a stable frame for a soft transition.",
    preservationPriority: "maximum",
    qualityRisk: "medium",
  },
};

export function getCameraProfile(
  category: string
): CameraProfile {
  switch (category) {
    case "aerial":
      return CAMERA_PROFILES.aerial;

    case "front_exterior":
      return CAMERA_PROFILES.heroExterior;

    case "rear_exterior":
      return CAMERA_PROFILES.rearExterior;

    case "entry":
      return CAMERA_PROFILES.entry;

    case "foyer":
      return CAMERA_PROFILES.foyer;

    case "hallway":
      return CAMERA_PROFILES.hallway;

    case "stairs":
      return CAMERA_PROFILES.stairs;

    case "living_room":
      return CAMERA_PROFILES.livingRoom;

    case "family_room":
      return CAMERA_PROFILES.familyRoom;

    case "kitchen":
      return CAMERA_PROFILES.kitchenReveal;

    case "dining_room":
      return CAMERA_PROFILES.diningRoom;

    case "office":
      return CAMERA_PROFILES.office;

    case "primary_bedroom":
      return CAMERA_PROFILES.primaryBedroom;

    case "bedroom":
      return CAMERA_PROFILES.bedroom;

    case "primary_bathroom":
      return CAMERA_PROFILES.primaryBathroom;

    case "bathroom":
      return CAMERA_PROFILES.bathroom;

    case "laundry":
      return CAMERA_PROFILES.laundry;

    case "basement":
      return CAMERA_PROFILES.basement;

    case "garage":
      return CAMERA_PROFILES.garage;

    case "gym":
      return CAMERA_PROFILES.gym;

    case "theater":
      return CAMERA_PROFILES.theater;

    case "game_room":
      return CAMERA_PROFILES.gameRoom;

    case "wine_cellar":
      return CAMERA_PROFILES.wineCellar;

    case "guest_house":
      return CAMERA_PROFILES.guestHouse;

    case "patio_deck":
      return CAMERA_PROFILES.patioDeck;

    case "backyard":
      return CAMERA_PROFILES.backyard;

    case "pool":
      return CAMERA_PROFILES.pool;

    case "outdoor_kitchen":
      return CAMERA_PROFILES.outdoorKitchen;

    case "fire_pit":
      return CAMERA_PROFILES.firePit;

    case "dock":
      return CAMERA_PROFILES.dock;

    case "view":
      return CAMERA_PROFILES.view;

    case "detail":
      return CAMERA_PROFILES.detail;

    default:
      return CAMERA_PROFILES.default;
  }
}
