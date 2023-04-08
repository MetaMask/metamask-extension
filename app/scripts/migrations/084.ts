import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { v4 } from 'uuid';

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
  if (
    !isObject(state.NetworkController)
  ) {
    return state;
  }
  const NetworkController: any = state.NetworkController;

  const networkConfigurations: Record<string, object> = NetworkController.networkConfigurations;

  const newNetworkConfigurations: Record<string, object> = {};

  for (const networkConfigurationId in networkConfigurations) {
    newNetworkConfigurations[networkConfigurationId] = {
      ...networkConfigurations[networkConfigurationId],
      id: networkConfigurationId,
    }
  }

  return {
    ...state,
    NetworkController: {
      ...NetworkController,
      networkConfigurations: newNetworkConfigurations,
    },
  };
}
