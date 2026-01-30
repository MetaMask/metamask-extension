/**
 * Utility function to wait for a specified duration
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified duration
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
