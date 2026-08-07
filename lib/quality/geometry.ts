export type GeometryAssessment = {
  geometryWarpDetected: boolean;
  geometryScore: number;
  problems: string[];
};

export function assessGeometry(
  score: number,
  problems: string[] = []
): GeometryAssessment {
  const normalized = Math.max(
    0,
    Math.min(100, score)
  );

  return {
    geometryWarpDetected:
      normalized < 78 ||
      problems.length > 0,
    geometryScore: normalized,
    problems,
  };
}
