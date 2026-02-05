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
 * This migration does:
 * - Add MegaETH Testnet v2 to the network controller
 * - Update the selected network client id to mainnet if it is the old MegaETH Testnet v1.
 * - Remove the old MegaETH Testnet v1 network configuration.
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
  // Validate NetworkController
  if (!hasProperty(state, 'NetworkController')) {
    captureException(
      new Error(`Migration ${version}: NetworkController not found.`),
    );
    return state;
  }

  const networkState = state.NetworkController;

  if (!isObject(networkState)) {
    captureException(
      new Error(
        `Migration ${version}: NetworkController is not an object: ${typeof networkState}`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkState, 'networkConfigurationsByChainId')) {
    captureException(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    return state;
  }

  if (!isObject(networkState.networkConfigurationsByChainId)) {
    captureException(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: ${typeof networkState.networkConfigurationsByChainId}.`,
      ),
    );
    return state;
  }

  const { networkConfigurationsByChainId } = networkState;

  // Validate NetworkEnablementController - but continue if missing
  const networkEnablementState = validateNetworkEnablementController(state);
  const eip155NetworkMap = networkEnablementState
    ? networkEnablementState.enabledNetworkMap[KnownCaipNamespace.Eip155]
    : null;

  // Merge the MegaETH Testnet v2 network configuration if user already has it.
  if (
    hasProperty(
      networkConfigurationsByChainId,
      MEGAETH_TESTNET_V2_CONFIG.chainId,
    )
  ) {
    const megaethTestnetV2Configuration = networkConfigurationsByChainId[
      MEGAETH_TESTNET_V2_CONFIG.chainId
    ] as unknown as NetworkConfiguration;
    megaethTestnetV2Configuration.name = MEGAETH_TESTNET_V2_CONFIG.name;
    megaethTestnetV2Configuration.nativeCurrency =
      MEGAETH_TESTNET_V2_CONFIG.nativeCurrency;

    const isEndpointExist = megaethTestnetV2Configuration.rpcEndpoints.find(
      (rpcEndpoint) =>
        rpcEndpoint.url === MEGAETH_TESTNET_V2_CONFIG.rpcEndpoints[0].url,
    );
    if (!isEndpointExist) {
      megaethTestnetV2Configuration.rpcEndpoints.push({
        failoverUrls: [],
        networkClientId:
          MEGAETH_TESTNET_V2_CONFIG.rpcEndpoints[0].networkClientId,
        type: RpcEndpointType.Custom,
        url: MEGAETH_TESTNET_V2_CONFIG.rpcEndpoints[0].url,
      });
      megaethTestnetV2Configuration.defaultRpcEndpointIndex =
        megaethTestnetV2Configuration.rpcEndpoints.length - 1;
    }

    const isBlockExplorerUrlExist =
      megaethTestnetV2Configuration.blockExplorerUrls.find(
        (url) => url === MEGAETH_TESTNET_V2_CONFIG.blockExplorerUrls[0],
      );
    if (!isBlockExplorerUrlExist) {
      megaethTestnetV2Configuration.blockExplorerUrls.push(
        MEGAETH_TESTNET_V2_CONFIG.blockExplorerUrls[0],
      );
      megaethTestnetV2Configuration.defaultBlockExplorerUrlIndex =
        megaethTestnetV2Configuration.blockExplorerUrls.length - 1;
    }
  } else {
    // Add the MegaETH Testnet v2 network configuration if user doesn't have it.
    (networkConfigurationsByChainId as Record<string, NetworkConfiguration>)[
      MEGAETH_TESTNET_V2_CONFIG.chainId
    ] = MEGAETH_TESTNET_V2_CONFIG as NetworkConfiguration;
  }

  // Only perform NetworkEnablementController operations if it exists
  if (eip155NetworkMap) {
    // Add the MegaETH Testnet v2 network configuration to the enabled network map if it doesn't exist.
    if (!hasProperty(eip155NetworkMap, MEGAETH_TESTNET_V2_CONFIG.chainId)) {
      (eip155NetworkMap as Record<string, boolean>)[
        MEGAETH_TESTNET_V2_CONFIG.chainId
      ] = false;
    }

    const megaethTestnetV1Configuration =
      networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID];
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
    // If the MegaETH Testnet v1 network configuration exists, then remove it.
    if (hasProperty(eip155NetworkMap, MEGAETH_TESTNET_V1_CHAIN_ID)) {
      delete eip155NetworkMap[MEGAETH_TESTNET_V1_CHAIN_ID];
    }
  }

  // If the MegaETH Testnet v1 network configuration exists, then remove it.
  if (networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID]) {
    delete networkConfigurationsByChainId[MEGAETH_TESTNET_V1_CHAIN_ID];
  }

  return state;
}

/**
 * Validates the NetworkEnablementController state structure.
 * Returns the validated state if valid, undefined if invalid or missing.
 * Logs warnings but does not throw exceptions for missing/invalid state.
 *
 * @param state - The full state object
 * @returns The validated NetworkEnablementController state or undefined
 */
function validateNetworkEnablementController(state: Record<string, unknown>):
  | {
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: Record<string, boolean>;
      };
    }
  | undefined {
  if (!hasProperty(state, 'NetworkEnablementController')) {
    console.warn(
      `Migration ${version}: NetworkEnablementController not found, skipping NetworkEnablementController migration.`,
    );
    return undefined;
  }

  const networkEnablementState = state.NetworkEnablementController;

  if (!isObject(networkEnablementState)) {
    console.warn(
      `Migration ${version}: NetworkEnablementController is not an object: ${typeof networkEnablementState}, skipping NetworkEnablementController migration.`,
    );
    return undefined;
  }

  if (!hasProperty(networkEnablementState, 'enabledNetworkMap')) {
    console.warn(
      `Migration ${version}: NetworkEnablementController missing property enabledNetworkMap, skipping NetworkEnablementController migration.`,
    );
    return undefined;
  }

  if (!isObject(networkEnablementState.enabledNetworkMap)) {
    console.warn(
      `Migration ${version}: NetworkEnablementController.enabledNetworkMap is not an object: ${typeof networkEnablementState.enabledNetworkMap}, skipping NetworkEnablementController migration.`,
    );
    return undefined;
  }

  if (
    !hasProperty(
      networkEnablementState.enabledNetworkMap,
      KnownCaipNamespace.Eip155,
    )
  ) {
    console.warn(
      `Migration ${version}: NetworkEnablementController.enabledNetworkMap missing property Eip155, skipping NetworkEnablementController migration.`,
    );
    return undefined;
  }

  if (
    !isObject(
      networkEnablementState.enabledNetworkMap[KnownCaipNamespace.Eip155],
    )
  ) {
    console.warn(
      `Migration ${version}: NetworkEnablementController.enabledNetworkMap[Eip155] is not an object: ${typeof networkEnablementState.enabledNetworkMap[KnownCaipNamespace.Eip155]}, skipping NetworkEnablementController migration.`,
    );
    return undefined;
  }

  return networkEnablementState as {
    enabledNetworkMap: {
      [KnownCaipNamespace.Eip155]: Record<string, boolean>;
    };
  };
}
