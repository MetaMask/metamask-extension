import { hasProperty } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 187;

/**
 * This migration sets the initial delay end for profile emtrics to the current time
 * if `pna25Acknowledged` is set to `true`. i.e. if the user has already acknowledged PNA25,
 * we want to start collecting profile metrics right away.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
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
  }
}
