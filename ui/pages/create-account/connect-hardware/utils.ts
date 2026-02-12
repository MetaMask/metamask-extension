/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export const capitalizeStr = (str: string) => {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Extracts a human-readable error message from an unknown error value.
 *
 * @param error - The error value to extract a message from
 * @returns The error message string
 */
export const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
