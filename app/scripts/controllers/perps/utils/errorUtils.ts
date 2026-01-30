/**
 * Utility functions for error handling in perps-controller.
 * These are general-purpose utilities for safe error handling.
 */

/**
 * Ensures we have a proper Error object for logging.
 * Converts unknown/string errors to proper Error instances.
 *
 * @param error - The caught error (could be Error, string, or unknown)
 * @returns A proper Error instance
 */
export function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
