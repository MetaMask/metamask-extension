import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { NetworkStatus } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';

export const version = 94;

/**
 * Migrate NetworkDetails & NetworkStatus state on the NetworkConroller to NetworksMetadata and add selectedNetworkClientId
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
    isObject(state.NetworkController.providerConfig) &&
    (hasProperty(state.NetworkController.providerConfig, 'id') ||
      (hasProperty(state.NetworkController.providerConfig, 'type') &&
        state.NetworkController.providerConfig.type !== NetworkType.rpc))
  ) {
    const selectedNetworkClientId =
      state.NetworkController.providerConfig.id ||
      state.NetworkController.providerConfig.type;

    if (
      !selectedNetworkClientId ||
      typeof selectedNetworkClientId !== 'string'
    ) {
      return state;
    }

    const networksMetadata = {
      [selectedNetworkClientId]: {
        EIPS: {},
        status: NetworkStatus.Unknown,
      },
    };

    if (
      hasProperty(state.NetworkController, 'networkDetails') &&
      isObject(state.NetworkController.networkDetails)
    ) {
      const { networkDetails } = state.NetworkController;

      if (networkDetails.EIPS && isObject(networkDetails.EIPS)) {
        networksMetadata[selectedNetworkClientId].EIPS = {
          ...networkDetails.EIPS,
        };
      }

      delete state.NetworkController.networkDetails;
    }

    if (
      hasProperty(state.NetworkController, 'networkStatus') &&
      typeof state.NetworkController.networkStatus === 'string'
    ) {
      networksMetadata[selectedNetworkClientId].status = state.NetworkController
        .networkStatus as NetworkStatus;
      delete state.NetworkController.networkStatus;
    }

    return {
      ...state,
      NetworkController: {
        ...state.NetworkController,
        networksMetadata,
        selectedNetworkClientId,
      },
    };
  } else if (!isObject(state.NetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController is ${typeof state.NetworkController}`,
      ),
    );
  } else if (
    isObject(state.NetworkController) &&
    !isObject(state.NetworkController.providerConfig)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController.providerConfig is ${typeof state
          .NetworkController.providerConfig}`,
      ),
    );
  } else if (
    isObject(state.NetworkController) &&
    isObject(state.NetworkController.providerConfig)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.NetworkController.providerConfig.id is ${typeof state
          .NetworkController.providerConfig
          .id} and state.NetworkController.providerConfig.type is ${
          state.NetworkController.providerConfig.type
        }`,
      ),
    );
  }
  return state;
}
