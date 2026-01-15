import { hasProperty } from '@metamask/utils';
import { Migrate } from './types';

export const version = 187;

/**
 * This migration sets the initial delay end for profile emtrics to the current time
 * if `pna25Acknowledged` is set to `true`. i.e. if the user has already acknowledged PNA25,
 * we want to start collecting profile metrics right away.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param versionedData.meta - Metadata about the state being migrated.
 * @param versionedData.meta.version - The current state version.
 * @param versionedData.meta.storageKind - The kind of storage being used.
 * @param versionedData.data - The persisted MetaMask state, keyed by controller.
 * @param changedKeys - `Set` to track which controller keys were modified by a migration
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedKeys);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedKeys: Set<string>,
): Promise<void> | void {
  const appStateControllerState = state?.AppStateController as
    | Record<string, unknown>
    | undefined;

  const profileMetricsControllerState = state?.ProfileMetricsController as
    | Record<string, unknown>
    | undefined;

  if (
    profileMetricsControllerState &&
    appStateControllerState &&
    hasProperty(appStateControllerState, 'pna25Acknowledged') &&
    typeof appStateControllerState.pna25Acknowledged === 'boolean' &&
    appStateControllerState.pna25Acknowledged === true &&
    !hasProperty(profileMetricsControllerState, 'initialDelayEndTimestamp')
  ) {
    profileMetricsControllerState.initialDelayEndTimestamp = Date.now();
    changedKeys.add('ProfileMetricsController');
  }
}
