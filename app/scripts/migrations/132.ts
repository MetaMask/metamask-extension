import { hasProperty } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 132;

/**
 * This migration removes properties from the CurrencyController state that
 * are no longer used. There presence in state causes "No metadata found" errors
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

/**
 * Remove the notification controller from state (and any persisted notifications).
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function transformState(state: Record<string, unknown>): void {
  // we're removing the NotificationController in favor of the NotificationServicesController
  if (hasProperty(state, 'NotificationController')) {
    delete state.NotificationController;
  }
}
