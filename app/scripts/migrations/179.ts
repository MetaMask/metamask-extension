import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 179;

/**
 * This migration clears the urlScanCache from PhishingController
 *
 * @param originalVersionedData - The original state data to migrate
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
  if (
    hasProperty(state, 'PhishingController') &&
    isObject(state.PhishingController)
  ) {
    const phishingController = state.PhishingController as Record<
      string,
      unknown
    >;

    // Clear the urlScanCache if it exists
    if (hasProperty(phishingController, 'urlScanCache')) {
      phishingController.urlScanCache = {};
    }
  }

  return state;
}
