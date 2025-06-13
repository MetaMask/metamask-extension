import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
} from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 166;

/**
 * This migration adds Base network to the `NetworkController` as it is enabled by default.
 * - It modifies the `NetworkController.state.networkConfigurationsByChainId` to include Base network.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with base network added
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!hasProperty(state, 'NetworkController')) {
    console.warn(`Migration ${version}: NetworkController not found.`);
    return state;
  }

  const networkState = state.NetworkController;
  if (!isObject(networkState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController is not an object: ${typeof networkState}`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkState, 'networkConfigurationsByChainId')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    return state;
  }

  if (!isObject(networkState.networkConfigurationsByChainId)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: ${typeof networkState.networkConfigurationsByChainId}.`,
      ),
    );
    return state;
  }

  // User already has base network added
  if (networkState.networkConfigurationsByChainId[CHAIN_IDS.BASE]) {
    return state;
  }

  networkState.networkConfigurationsByChainId[CHAIN_IDS.BASE] =
    getBaseNetworkConfiguration();

  return state;
}

// Exported for testing purposes
export function getBaseNetworkConfiguration() {
  return {
    blockExplorerUrls: [],
    chainId: '0x2105' as const, // toHex(8453) Base Network
    defaultRpcEndpointIndex: 0,
    name: 'Base Mainnet',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        failoverUrls: getFailoverUrlsForInfuraNetwork('base-mainnet'),
        networkClientId: 'base-mainnet',
        type: 'infura',
        url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  };
}
