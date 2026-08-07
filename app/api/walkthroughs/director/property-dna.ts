export type PropertyDNA = {
  propertyType: string;
  architecturalStyle: string;
  luxuryLevel: string;
  exterior: Record<string, string>;
  interior: Record<string, string>;
  kitchen: Record<string, string>;
  livingAreas: Record<string, string>;
  bedrooms: Record<string, string>;
  bathrooms: Record<string, string>;
  outdoor: {
    patio: string;
    pool: string;
    fencing: string;
    views: string;
    amenities: string[];
  };
  standoutFeatures: string[];
  continuityRules: string[];
};

export function createFallbackPropertyDNA(): PropertyDNA {
  const preserve = "Preserve source imagery";

  return {
    propertyType: "Residential property",
    architecturalStyle: "Not clearly visible",
    luxuryLevel: "Not clearly visible",
    exterior: {
      siding: preserve,
      roof: preserve,
      windows: preserve,
      doors: preserve,
      garage: preserve,
      driveway: preserve,
      landscaping: preserve,
    },
    interior: {
      flooring: preserve,
      walls: preserve,
      ceilings: preserve,
      trim: preserve,
      lighting: preserve,
      colorPalette: preserve,
    },
    kitchen: {
      cabinets: preserve,
      countertops: preserve,
      backsplash: preserve,
      appliances: preserve,
      island: preserve,
      hardware: preserve,
    },
    livingAreas: {
      fireplace: preserve,
      windows: preserve,
      ceilingFeatures: preserve,
      builtIns: preserve,
    },
    bedrooms: {
      flooring: preserve,
      walls: preserve,
      windows: preserve,
    },
    bathrooms: {
      vanities: preserve,
      tile: preserve,
      mirrors: preserve,
      fixtures: preserve,
      glass: preserve,
    },
    outdoor: {
      patio: preserve,
      pool: preserve,
      fencing: preserve,
      views: preserve,
      amenities: [],
    },
    standoutFeatures: [],
    continuityRules: [
      "Preserve every visible architectural line exactly.",
      "Do not add, remove, move, repaint, relight, or redesign anything.",
      "Keep furniture, fixtures, landscaping, reflections, and views stationary.",
    ],
  };
}

export function summarizePropertyDNA(
  dna: PropertyDNA
): string {
  return [
    dna.propertyType,
    dna.architecturalStyle,
    dna.luxuryLevel,
    ...dna.standoutFeatures,
  ]
    .filter(Boolean)
    .join("; ");
}
