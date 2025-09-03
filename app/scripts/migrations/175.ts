import { cloneDeep, isObject } from 'lodash';
import { hasProperty } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 175;

/**
 * This migration adds `productTour` property to AppStateController
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController)
  ) {
    const appStateController = state.AppStateController as Record<
      string,
      unknown
    >;

    // Only set property if it doesn't already exist
    if (
      !hasProperty(appStateController, 'productTour') ||
      appStateController.productTour === undefined
    ) {
      // Default to showing account icon tour
      appStateController.productTour = 'accountIcon';
    }
  }

  return state;
}
