import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 184;

export const MEGAETH_TESTNET_V1_CHAIN_ID = '0x18c6'; // 6342

export const MEGAETH_TESTNET_V2_CONFIG = {
  chainId: '0x18c7', // 6343
  name: 'MegaETH Testnet',
  nativeCurrency: 'MegaETH',
  blockExplorerUrls: ['https://megaeth-testnet-v2.blockscout.com'],
  defaultRpcEndpointIndex: 0,
  defaultBlockExplorerUrlIndex: 0,
  rpcEndpoints: [
    {
      failoverUrls: [],
      networkClientId: 'megaeth-testnet-v2',
      type: RpcEndpointType.Custom,
      url: 'https://timothy.megaeth.com/rpc',
    },
  ],
};

/**
 * This migration adds MegaETH Testnet v2 to the network controller
 * as a default Testnet.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: VersionedData) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  try {
    transformState(versionedData.data);
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
    versionedData.data = originalVersionedData.data;
  }

  return versionedData;
}

function transformState(state: Record<string, unknown>) {
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

  const { networkConfigurationsByChainId } = networkState;

  // Add the MegaETH Testnet v2 network configuration.
  networkConfigurationsByChainId[MEGAETH_TESTNET_V2_CONFIG.chainId] =
    MEGAETH_TESTNET_V2_CONFIG;

  // If the MegaETH Testnet v1 network configuration exists, then remove it.
  if (networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID]) {
    delete networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID];
  }

  return state;
}
