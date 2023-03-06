import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

export const version = 78;

/**
 * The`@metamask/phishing-controller` state was updated in v2.0.0.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    versionedData.data = transformState(versionedData.data);
    return versionedData;
  },
};

function transformState(state) {
  if (
    !hasProperty(state, 'PhishingController') ||
    !isObject(state.PhishingController)
  ) {
    return state;
  }
  const { PhishingController } = state;

  delete PhishingController.phishing;
  delete PhishingController.lastFetched;

  return state;
}
