export type ArchitectureAssessment = {
  architectureChanged: boolean;
  furnitureOrFixtureChanged: boolean;
  architectureScore: number;
  problems: string[];
};

export function assessArchitecture(args: {
  architectureScore: number;
  furnitureChanged?: boolean;
  problems?: string[];
}): ArchitectureAssessment {
  const score = Math.max(
    0,
    Math.min(100, args.architectureScore)
  );

  const problems = args.problems ?? [];

  return {
    architectureChanged:
      score < 82 ||
      problems.length > 0,
    furnitureOrFixtureChanged:
      args.furnitureChanged === true,
    architectureScore: score,
    problems,
  };
}
