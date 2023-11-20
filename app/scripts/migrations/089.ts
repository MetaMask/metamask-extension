import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 89;

/**
 * Add an `id` to the `providerConfig` object.
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
    hasProperty(state.NetworkController, 'providerConfig') &&
    isObject(state.NetworkController.providerConfig)
  ) {
    const { networkConfigurations, providerConfig } = state.NetworkController;

    if (!isObject(networkConfigurations)) {
      return state;
    }

    if (providerConfig.id) {
      return state;
    }

    let newProviderConfigId;

    for (const networkConfigurationId of Object.keys(networkConfigurations)) {
      const networkConfiguration =
        networkConfigurations[networkConfigurationId];
      if (!isObject(networkConfiguration)) {
        return state;
      }
      if (networkConfiguration.rpcUrl === providerConfig.rpcUrl) {
        newProviderConfigId = networkConfiguration.id;
        break;
      }
    }

    if (!newProviderConfigId) {
      return state;
    }

    state.NetworkController.providerConfig = {
      ...providerConfig,
      id: newProviderConfigId,
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
  } else if (!isObject(state.NetworkController.providerConfig)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController.providerConfig is ${typeof state
          .NetworkController.providerConfig}`,
      ),
    );
  }
  return state;
}
