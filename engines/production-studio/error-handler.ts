export function productionError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    typeof error === "string"
      ? error
      : "Unknown WalkNWow production error."
  );
}
