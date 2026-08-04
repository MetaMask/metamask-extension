import { getBooleanFeatureFlag } from '../../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import { getRemoteFeatureFlagState } from '../../controllers/analytics';

/**
 * Whether the background may emit `ramps-*` events. The UI gates its own events
 * inside `useRampsAnalytics`, but the checkout watcher and order polling outlive
 * the popup, so a rollback while a checkout or order is in flight would
 * otherwise keep reporting. Resolved per event through the same manifest-merged
 * flag the UI reads, so overrides and version gating behave identically.
 *
 * @returns True when the ramps rollout flag is currently on.
 */
export function isRampsAnalyticsEnabled(): boolean {
  const { rampsEnabled } = getRemoteFeatureFlags({
    metamask: { remoteFeatureFlags: getRemoteFeatureFlagState() },
  });

  return getBooleanFeatureFlag(rampsEnabled, false);
}
