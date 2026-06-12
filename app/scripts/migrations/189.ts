import {
  getErrorMessage,
  hasProperty,
  Hex,
  isHexString,
  isObject,
} from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';
import { captureException } from '../../../shared/lib/sentry';
import { infuraProjectId } from '../../../shared/constants/network';

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

export const version = 189;

export const MEGAETH_MAINNET_CHAIN_ID: string = '0x10e6';

/**
 * This migration does:
 * - Update the MegaETH Mainnet network configuration if present set RPC endpoint URL to Infura and Block Explorer to Blockscout.
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
  const changedLocalChangedControllers = new Set<string>();

  try {
    transformState(changedVersionedData.data, changedLocalChangedControllers);
    versionedData.data = changedVersionedData.data;
    changedLocalChangedControllers.forEach((controller) =>
      localChangedControllers.add(controller),
    );
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

function transformState(
  state: Record<string, unknown>,
  changedLocalChangedControllers: Set<string>,
) {
  const networkControllerState = validateNetworkController(state);
  if (networkControllerState === undefined) {
    // There used to be a warning "Migration 189: Missing or invalid NetworkController state, skip the migration"
    // But it is expected during some tests and caused new baseline violations se we removed it.
    return state;
  }

  const { networkConfigurationsByChainId } = networkControllerState;
  // Migrate NetworkController:
  // - Migrates the MegaETH Mainnet network configuration if user already has it.
  if (hasProperty(networkConfigurationsByChainId, MEGAETH_MAINNET_CHAIN_ID)) {
    const megaethMainnetConfiguration =
      networkConfigurationsByChainId[MEGAETH_MAINNET_CHAIN_ID];

    if (!isValidNetworkConfiguration(megaethMainnetConfiguration)) {
      console.warn(
        `Migration ${version}: Invalid MegaETH Mainnet network configuration, skip the migration`,
      );
      return state;
    }

    mergeMegaEthMainnetNetworkConfiguration(megaethMainnetConfiguration);
    changedLocalChangedControllers.add('NetworkController');
  }

  return state;
}

function mergeMegaEthMainnetNetworkConfiguration(
  megaethMainnetConfiguration: NetworkConfiguration,
) {
  // If the Infura Project ID is set and the same RPC doesn't already exist, we add it and set by default
  if (infuraProjectId) {
    const newInfuraURL = `https://megaeth-mainnet.infura.io/v3/${infuraProjectId}`;
    const isInfuraRpcPresent = megaethMainnetConfiguration.rpcEndpoints.find(
      (rpc) => rpc.url === newInfuraURL,
    );
    // Avoid RPC duplication if Infura is already present.
    if (!isInfuraRpcPresent) {
      megaethMainnetConfiguration.rpcEndpoints.push({
        failoverUrls: [],
        networkClientId: v4(),
        type: 'custom',
        url: newInfuraURL,
      });
      megaethMainnetConfiguration.defaultRpcEndpointIndex =
        megaethMainnetConfiguration.rpcEndpoints.length - 1;
    }
  } else {
    captureException(
      new Error(
        `Migration ${version}: Infura project ID is not set, skip the MegaETH RPC part of the migration`,
      ),
    );
  }

  // If  Blockscout is not part of the already present explorers, add it and set as default.
  const newBlockExplorerUrl = 'https://megaeth.blockscout.com';
  const isBlockExplorerUrlExist =
    megaethMainnetConfiguration.blockExplorerUrls.find(
      (url) => url.includes(newBlockExplorerUrl), // Using "includes" for in case of trailing slash.
    );
  if (!isBlockExplorerUrlExist) {
    megaethMainnetConfiguration.blockExplorerUrls.push(newBlockExplorerUrl);
    megaethMainnetConfiguration.defaultBlockExplorerUrlIndex =
      megaethMainnetConfiguration.blockExplorerUrls.length - 1;
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
