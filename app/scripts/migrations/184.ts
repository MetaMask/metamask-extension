import {
  getErrorMessage,
  hasProperty,
  isObject,
  KnownCaipNamespace,
} from '@metamask/utils';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export type VersionedData = {
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
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: NetworkController not found.`),
    );
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

  if (!hasProperty(state, 'NetworkEnablementController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: NetworkEnablementController not found.`),
    );
    return state;
  }

  const networkEnablementState = state.NetworkEnablementController;

  if (!isObject(networkEnablementState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkEnablementController is not an object: ${typeof networkEnablementState}`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkEnablementState, 'enabledNetworkMap')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkEnablementController missing property enabledNetworkMap.`,
      ),
    );
    return state;
  }

  if (!isObject(networkEnablementState.enabledNetworkMap)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkEnablementController.enabledNetworkMap is not an object: ${typeof networkEnablementState.enabledNetworkMap}.`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(
      networkEnablementState.enabledNetworkMap,
      KnownCaipNamespace.Eip155,
    )
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkEnablementController.enabledNetworkMap missing property Eip155.`,
      ),
    );
    return state;
  }

  if (
    !isObject(
      networkEnablementState.enabledNetworkMap[KnownCaipNamespace.Eip155],
    )
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkEnablementController.enabledNetworkMap[Eip155] is not an object: ${typeof networkEnablementState.enabledNetworkMap[KnownCaipNamespace.Eip155]}.`,
      ),
    );
    return state;
  }

  const { networkConfigurationsByChainId } = networkState;
  const {
    enabledNetworkMap: { [KnownCaipNamespace.Eip155]: eip155NetworkMap },
  } = networkEnablementState;

  const megaethTestnetV1Configuration = networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID] as unknown as NetworkConfiguration;

  // Add the MegaETH Testnet v2 network configuration.
  networkConfigurationsByChainId[MEGAETH_TESTNET_V2_CONFIG.chainId] =
    MEGAETH_TESTNET_V2_CONFIG;

  // Add the MegaETH Testnet v2 network configuration to the enabled network map.
  eip155NetworkMap[MEGAETH_TESTNET_V2_CONFIG.chainId] = false;

  // If the selected network client id is the old MegaETH Testnet v1,
  // then update it to the mainnet
  if (
    hasProperty(networkState, 'selectedNetworkClientId') &&
    typeof networkState.selectedNetworkClientId === 'string' &&
    megaethTestnetV1Configuration &&
    isObject(megaethTestnetV1Configuration) &&
    hasProperty(megaethTestnetV1Configuration, 'rpcEndpoints') &&
    Array.isArray(megaethTestnetV1Configuration.rpcEndpoints) &&
    megaethTestnetV1Configuration.rpcEndpoints.some(
      (rpcEndpoint) =>
        rpcEndpoint.networkClientId === networkState.selectedNetworkClientId,
    )
  ) {
    networkState.selectedNetworkClientId = 'mainnet';
    // force mainnet to be enabled
    eip155NetworkMap['0x1'] = true;
  }
   // If the MegaETH Testnet v1 network configuration is enabled, then remove it.
  if (hasProperty(eip155NetworkMap, MEGAETH_TESTNET_V1_CHAIN_ID)) {
    delete eip155NetworkMap[MEGAETH_TESTNET_V1_CHAIN_ID];
  }

  // If the MegaETH Testnet v1 network configuration exists, then remove it.
  if (networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID]) {
    delete networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID];
  }

  return state;
}
