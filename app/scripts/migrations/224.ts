import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 224;

/**
 * This migration removes the urlScanCache, tokenScanCache, and
 * addressScanCache properties from PhishingController state. Scan results are
 * now cached (and persisted) by the PhishingDataService query cache instead
 * of controller state.
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

    delete phishingController.urlScanCache;
    delete phishingController.tokenScanCache;
    delete phishingController.addressScanCache;
  }

  return state;
}
