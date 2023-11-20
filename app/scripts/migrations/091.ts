import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 91;

/**
 * Delete network configurations if they do not have a chain id
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
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurations') &&
    isObject(state.NetworkController.networkConfigurations)
  ) {
    const { networkConfigurations } = state.NetworkController;

    for (const [networkConfigurationId, networkConfiguration] of Object.entries(
      networkConfigurations,
    )) {
      if (isObject(networkConfiguration)) {
        if (!networkConfiguration.chainId) {
          delete networkConfigurations[networkConfigurationId];
        }
      }
    }

    state.NetworkController = {
      ...state.NetworkController,
      networkConfigurations,
    };

    return {
      ...state,
      NetworkController: state.NetworkController,
    };
  } else if (!isObject(state.NetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController is ${typeof state.NetworkController}`,
      ),
    );
  } else if (!isObject(state.NetworkController.networkConfigurations)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController.networkConfigurations is ${typeof state
          .NetworkController.networkConfigurations}`,
      ),
    );
  }
  return state;
}
