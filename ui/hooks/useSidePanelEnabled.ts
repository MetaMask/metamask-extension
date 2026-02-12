import { getIsSidePanelFeatureEnabled } from '../../shared/modules/environment';

/**
 * Custom hook to check if sidepanel feature is enabled.
 * Checks the build-time environment flag and browser compatibility.
 * Returns false for Firefox (no sidePanel API) and Arc browser (doesn't support sidepanel properly).
 *
 * @returns boolean - True if sidepanel feature is enabled, false otherwise
 */
export const useSidePanelEnabled = (): boolean => {
  return getIsSidePanelFeatureEnabled();
};
