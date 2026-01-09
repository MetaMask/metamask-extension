import {
  getErrorMessage,
  hasProperty,
  Hex,
  isHexString,
  isObject,
  KnownCaipNamespace,
} from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';
import { captureException } from '../../../shared/lib/sentry';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

/**
 * A Copy of the RpcEndpoint type from the network controller,
 * This is used to avoid the dependency on the network controller.
 */
type RpcEndpoint = {
  failoverUrls?: string[];
  name?: string;
  networkClientId: string;
  url: string;
  type: string;
};

/**
 * A Copy of the NetworkConfiguration type from the network controller,
 * This is used to avoid the dependency on the network controller.
 */
type NetworkConfiguration = {
  blockExplorerUrls: string[];
  chainId: Hex;
  defaultBlockExplorerUrlIndex?: number;
  defaultRpcEndpointIndex: number;
  name: string;
  nativeCurrency: string;
  rpcEndpoints: RpcEndpoint[];
};

export const version = 186;

export const MEGAETH_TESTNET_V1_CHAIN_ID = '0x18c6'; // 6342

export const MEGAETH_TESTNET_V2_CONFIG: NetworkConfiguration = {
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
      // In migration #184, we use timothy.megaeth.com/rpc,
      // but now we have updated to use carrot.megaeth.com/rpc due to megaETH changing their RPC URL.
      url: 'https://carrot.megaeth.com/rpc',
    },
  ],
};

/**
 * This migration does:
 * - Backfill and update the MegaETH Testnet v2 network configuration, including updating its RPC endpoint URL originally set in migration #184
 * -- Add MegaETH Testnet v2 to the network controller
 * -- Update the selected network client id to mainnet if it is the old MegaETH Testnet v1.
 * -- Remove the old MegaETH Testnet v1 network configuration.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @param localChangedControllers - A set of controller keys that have been changed by the migration.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  versionedData: VersionedData,
  localChangedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  const changedVersionedData = cloneDeep(versionedData);

  try {
    localChangedControllers.add('NetworkController');
    localChangedControllers.add('NetworkEnablementController');
    transformState(changedVersionedData.data);
    versionedData.data = changedVersionedData.data;
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
  }
}

function transformState(state: Record<string, unknown>) {
  const networkControllerState = validateNetworkController(state);
  if (networkControllerState === undefined) {
    console.warn(
      `Migration ${version}: Missing or invalid NetworkController state, skip the migration`,
    );
    return state;
  }

  const { networkConfigurationsByChainId, selectedNetworkClientId } =
    networkControllerState;

  // Migrate NetworkController:
  // - Merge the MegaETH Testnet v2 network configuration if user already has it.
  // - Add the MegaETH Testnet v2 network configuration if user doesn't have it.
  if (
    hasProperty(
      networkConfigurationsByChainId,
      MEGAETH_TESTNET_V2_CONFIG.chainId,
    )
  ) {
    const megaethTestnetV2Configuration =
      networkConfigurationsByChainId[MEGAETH_TESTNET_V2_CONFIG.chainId];

    if (!isValidNetworkConfiguration(megaethTestnetV2Configuration)) {
      console.warn(
        `Migration ${version}: Invalid MegaETH Testnet v2 network configuration, skip the migration`,
      );
      return state;
    }

    mergeMegaEthTestnetV2NetworkConfiguration(megaethTestnetV2Configuration);
  } else {
    networkControllerState.networkConfigurationsByChainId[
      MEGAETH_TESTNET_V2_CONFIG.chainId
    ] = MEGAETH_TESTNET_V2_CONFIG;
  }

  const networkEnablementControllerState =
    validateNetworkEnablementController(state);

  // Migrate NetworkEnablementController:
  // - Add the MegaETH Testnet v2 network configuration to the enabled network map if it doesn't exist.
  // - Switch to mainnet if the selected network client id is one of the megaeth testnet v1 rpc endpoint network client id.
  if (networkEnablementControllerState === undefined) {
    console.warn(
      `Migration ${version}: Missing or invalid NetworkEnablementController state, skip the NetworkEnablementController migration`,
    );

    // Switch to mainnet either:
    // 1. The selected network client id is one of the megaeth testnet v1 rpc endpoint network client id
    if (
      selectedNetworkClientId === 'megaeth-testnet' ||
      isNetworkClientIdExists(
        MEGAETH_TESTNET_V1_CHAIN_ID,
        selectedNetworkClientId,
        networkConfigurationsByChainId,
      )
    ) {
      networkControllerState.selectedNetworkClientId = 'mainnet';
    }
  } else {
    // Only perform the NetworkEnablementController migration if the NetworkEnablementController state is valid.
    const eip155NetworkMap =
      networkEnablementControllerState.enabledNetworkMap[
        KnownCaipNamespace.Eip155
      ];

    // Add the MegaETH Testnet v2 network configuration to the enabled network map if it doesn't exist.
    if (!hasProperty(eip155NetworkMap, MEGAETH_TESTNET_V2_CONFIG.chainId)) {
      networkEnablementControllerState.enabledNetworkMap[
        KnownCaipNamespace.Eip155
      ][MEGAETH_TESTNET_V2_CONFIG.chainId] = false;
    }

    const isMegaEthTestnetV1EnablementMapExists = hasProperty(
      eip155NetworkMap,
      MEGAETH_TESTNET_V1_CHAIN_ID,
    );

    const isMegaEthTestnetV1Enabled =
      isMegaEthTestnetV1EnablementMapExists &&
      eip155NetworkMap[MEGAETH_TESTNET_V1_CHAIN_ID] === true;

    // Switch to mainnet either:
    // 1. The MegaETH Testnet v1 is enabled or
    // 2. The selected network client id is one of the megaeth testnet v1 rpc endpoint network client id
    if (
      isMegaEthTestnetV1Enabled ||
      selectedNetworkClientId === 'megaeth-testnet' ||
      isNetworkClientIdExists(
        MEGAETH_TESTNET_V1_CHAIN_ID,
        selectedNetworkClientId,
        networkConfigurationsByChainId,
      )
    ) {
      // force mainnet to be enabled
      networkControllerState.selectedNetworkClientId = 'mainnet';
      networkEnablementControllerState.enabledNetworkMap[
        KnownCaipNamespace.Eip155
      ]['0x1'] = true;
    }

    // Remove the MegaETH Testnet v1 enablement map if it exists.
    if (isMegaEthTestnetV1EnablementMapExists) {
      delete networkEnablementControllerState.enabledNetworkMap[
        KnownCaipNamespace.Eip155
      ][MEGAETH_TESTNET_V1_CHAIN_ID];
    }
  }

  // Remove the MegaETH Testnet v1 network configuration.
  if (
    hasProperty(networkConfigurationsByChainId, MEGAETH_TESTNET_V1_CHAIN_ID)
  ) {
    delete networkControllerState.networkConfigurationsByChainId[
      MEGAETH_TESTNET_V1_CHAIN_ID
    ];
  }

  return state;
}

function mergeMegaEthTestnetV2NetworkConfiguration(
  megaethTestnetV2Configuration: NetworkConfiguration,
) {
  // override the name and native currency of the MegaETH Testnet v2 network configuration.
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
      networkClientId: v4(),
      type: 'custom',
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
}

function validateNetworkController(state: Record<string, unknown>):
  | {
      networkConfigurationsByChainId: Record<Hex, unknown>;
      selectedNetworkClientId: string;
    }
  | undefined {
  if (!hasProperty(state, 'NetworkController')) {
    // We catch the exception here, as we don't expect the NetworkController state is missing.
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: missing NetworkController`,
      ),
    );
    return undefined;
  }

  const networkControllerState = state.NetworkController;

  // To narrow the type of the networkControllerState to the expected type.
  if (!isValidNetworkControllerState(networkControllerState)) {
    return undefined;
  }

  return networkControllerState;
}

function validateNetworkEnablementController(state: Record<string, unknown>):
  | {
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: Record<string, boolean>;
      };
    }
  | undefined {
  if (!hasProperty(state, 'NetworkEnablementController')) {
    // we don't need to capture exception here, if the NetworkEnablementController state is not present,
    return undefined;
  }

  const networkEnablementControllerState = state.NetworkEnablementController;

  // To narrow the type of the networkEnablementControllerState to the expected type.
  if (
    !isValidNetworkEnablementControllerState(networkEnablementControllerState)
  ) {
    return undefined;
  }

  return networkEnablementControllerState;
}

function isValidNetworkControllerState(value: unknown): value is {
  networkConfigurationsByChainId: Record<Hex, unknown>;
  selectedNetworkClientId: string;
} {
  if (!isObject(value)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: NetworkController state is not an object: '${typeof value}'`,
      ),
    );
    return false;
  }

  if (!hasProperty(value, 'networkConfigurationsByChainId')) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: missing networkConfigurationsByChainId property`,
      ),
    );
    return false;
  }

  if (
    !isValidNetworkConfigurationsByChainId(value.networkConfigurationsByChainId)
  ) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: networkConfigurationsByChainId is not a valid Record<Hex, unknown>`,
      ),
    );
    return false;
  }

  if (!hasProperty(value, 'selectedNetworkClientId')) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: missing selectedNetworkClientId property`,
      ),
    );
    return false;
  }

  if (typeof value.selectedNetworkClientId !== 'string') {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: selectedNetworkClientId is not a string: '${typeof value.selectedNetworkClientId}'`,
      ),
    );
    return false;
  }

  return true;
}

function isValidNetworkConfigurationsByChainId(
  value: unknown,
): value is Record<Hex, unknown> {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([chainId]) => typeof chainId === 'string' && isHexString(chainId),
    )
  );
}

function isValidNetworkConfiguration(
  object: unknown,
): object is NetworkConfiguration {
  return (
    isObject(object) &&
    hasProperty(object, 'chainId') &&
    typeof object.chainId === 'string' &&
    isHexString(object.chainId) &&
    hasProperty(object, 'rpcEndpoints') &&
    Array.isArray(object.rpcEndpoints) &&
    object.rpcEndpoints.every(isValidRpcEndpoint) &&
    hasProperty(object, 'name') &&
    typeof object.name === 'string' &&
    hasProperty(object, 'nativeCurrency') &&
    typeof object.nativeCurrency === 'string' &&
    hasProperty(object, 'blockExplorerUrls') &&
    Array.isArray(object.blockExplorerUrls) &&
    object.blockExplorerUrls.every((url) => typeof url === 'string') &&
    hasProperty(object, 'defaultRpcEndpointIndex') &&
    typeof object.defaultRpcEndpointIndex === 'number' &&
    (!hasProperty(object, 'defaultBlockExplorerUrlIndex') ||
      (hasProperty(object, 'defaultBlockExplorerUrlIndex') &&
        typeof object.defaultBlockExplorerUrlIndex === 'number'))
  );
}

function isValidRpcEndpoint(object: unknown): boolean {
  return (
    isObject(object) &&
    hasProperty(object, 'networkClientId') &&
    typeof object.networkClientId === 'string' &&
    hasProperty(object, 'url') &&
    typeof object.url === 'string'
  );
}

function isNetworkClientIdExists(
  chainId: string,
  networkClientId: string,
  networkConfigurationsByChainId: Record<Hex, unknown>,
): boolean {
  if (!hasProperty(networkConfigurationsByChainId, chainId)) {
    return false;
  }
  const config = networkConfigurationsByChainId[chainId];
  return (
    isValidNetworkConfiguration(config) &&
    config.rpcEndpoints.some(
      (rpcEndpoint) => rpcEndpoint.networkClientId === networkClientId,
    )
  );
}

function isValidNetworkEnablementControllerState(value: unknown): value is {
  enabledNetworkMap: {
    [KnownCaipNamespace.Eip155]: Record<string, boolean>;
  };
} {
  if (!isObject(value)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkEnablementController state: '${typeof value}'`,
      ),
    );
    return false;
  }

  if (!hasProperty(value, 'enabledNetworkMap')) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkEnablementController state: missing property enabledNetworkMap.`,
      ),
    );
    return false;
  }

  if (!isObject(value.enabledNetworkMap)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkEnablementController state: NetworkEnablementController.enabledNetworkMap is not an object: ${typeof value.enabledNetworkMap}.`,
      ),
    );
    return false;
  }

  if (!hasProperty(value.enabledNetworkMap, KnownCaipNamespace.Eip155)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkEnablementController state: NetworkEnablementController.enabledNetworkMap missing property Eip155.`,
      ),
    );
    return false;
  }

  if (
    !isValidEip155NetworkMap(value.enabledNetworkMap[KnownCaipNamespace.Eip155])
  ) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkEnablementController state: NetworkEnablementController.enabledNetworkMap[Eip155] is not a valid enabledNetworkMap.`,
      ),
    );
    return false;
  }

  return true;
}

function isValidEip155NetworkMap(
  value: unknown,
): value is Record<string, boolean> {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([chainId, isEnabled]) =>
        typeof chainId === 'string' && typeof isEnabled === 'boolean',
    )
  );
}
