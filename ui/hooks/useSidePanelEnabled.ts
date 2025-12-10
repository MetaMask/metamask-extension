/**
 * Custom hook to check if sidepanel feature is enabled.
 * Checks the build-time environment flag.
 *
 * @returns boolean - True if sidepanel feature is enabled, false otherwise
 */
export const useSidePanelEnabled = (): boolean => {
  return process.env.IS_SIDEPANEL?.toString() === 'true';
};
