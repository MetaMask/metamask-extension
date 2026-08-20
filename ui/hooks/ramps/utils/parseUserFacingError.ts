export function parseUserFacingError(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const resourceError = (error as { error?: unknown }).error;
    if (typeof resourceError === 'string' && resourceError.trim()) {
      return resourceError;
    }
  }

  return fallbackMessage;
}
