import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { SelectedNetworkControllerState } from '@metamask/selected-network-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 110;

/**
 * Reset all values for SelectedNetworkController.state.domains
 * These values are associated with an experimental feature flag and should be reset before proceeding with
 * the feature development.
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

function transformState(state: Record<string, any>) {
  if (
    !hasProperty(state, 'SelectedNetworkController') ||
    !isObject(state.SelectedNetworkController) ||
    !hasProperty(state.SelectedNetworkController, 'domains') ||
    !isObject(state.SelectedNetworkController.domains)
  ) {
    return state;
  }

  const domains: SelectedNetworkControllerState['domains'] = {};
  if (state.SelectedNetworkController.domains.metamask) {
    (domains as any).metamask =
      state.SelectedNetworkController.domains.metamask;
  }

  state.SelectedNetworkController.domains = domains;

  return state;
}
