import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export const version = 176.1;

/**
 * This migration clears the legacy addressSecurityAlertResponses cache entries
 * that don't have timestamp fields, preparing for the new TTL-based caching system.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  try {
    const appStateControllerState = state.AppStateController;
    if (
      hasProperty(state, 'AppStateController') &&
      isObject(appStateControllerState) &&
      hasProperty(appStateControllerState, 'addressSecurityAlertResponses') &&
      isObject(appStateControllerState.addressSecurityAlertResponses)
    ) {
      // Clear all existing cache entries to force fresh fetches with timestamps
      // This ensures all cached entries will have the new timestamp field for TTL tracking
      appStateControllerState.addressSecurityAlertResponses = {};
    }
    return state;
  } catch (error) {
    captureException(
      new Error(
        `Migration ${version}: Failed to clear addressSecurityAlertResponses cache. Error: ${(error as Error).message}`,
      ),
    );
    return state;
  }
}
