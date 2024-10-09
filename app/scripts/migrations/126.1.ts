import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 126.1;

/**
 * This migration removes `providerConfig` from the network controller state.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
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

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (
    hasProperty(state, 'PhishingController') &&
    isObject(state.PhishingController) &&
    hasProperty(state.PhishingController, 'phishingLists')
  ) {
    const phishingController = state.PhishingController;

    if (!Array.isArray(phishingController.phishingLists)) {
      return state;
    }

    phishingController.phishingLists = phishingController.phishingLists.filter(
      (list) => list.name === 'MetaMask',
    );

    state.PhishingController = phishingController;
  }

  return state;
}
