import { cloneDeep } from 'lodash';
import { isObject } from '@metamask/utils';

export const version = 84;

/**
 * Ensure that each networkConfigurations object in state.NetworkController.networkConfigurations has an
 * `id` property which matches the key pointing that object
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
  if (!isObject(state.NetworkController)) {
    return state;
  }
  const { NetworkController }: any = state;

  if (!isObject(NetworkController.networkConfigurations)) {
    return state;
  }

  const {
    networkConfigurations,
  }: { networkConfigurations: Record<string, object> } = NetworkController;


  const newNetworkConfigurations: Record<string, Record<string, unknown>> = {};

  for (const networkConfigurationId of Object.keys(networkConfigurations)) {
    newNetworkConfigurations[networkConfigurationId] = {
      ...networkConfigurations[networkConfigurationId],
      id: networkConfigurationId,
    };
  }

  return {
    ...state,
    NetworkController: {
      ...NetworkController,
      networkConfigurations: newNetworkConfigurations,
    },
  };
}
