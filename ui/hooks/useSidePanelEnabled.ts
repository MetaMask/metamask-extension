import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getRemoteFeatureFlags } from '../selectors/remote-feature-flags';
import { getIsSidePanelFeatureEnabled } from '../../shared/modules/environment';

/**
 * Custom hook to check if sidepanel feature is enabled.
 * Checks both the build-time environment flag AND the LaunchDarkly feature flag.
 *
 * @returns boolean - True if sidepanel feature is enabled, false otherwise
 */
export const useSidePanelEnabled = (): boolean => {
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);

  const isSidePanelEnabled = useMemo(() => {
    const isBuildEnabled = getIsSidePanelFeatureEnabled();

    const isFeatureFlagEnabled = Boolean(
      remoteFeatureFlags?.extensionUxSidepanel,
    );

    // Both must be true for sidepanel to be enabled
    return isBuildEnabled && isFeatureFlagEnabled;
  }, [remoteFeatureFlags]);

  return isSidePanelEnabled;
};
