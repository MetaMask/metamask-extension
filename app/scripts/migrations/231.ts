import {
  getErrorMessage,
  hasProperty,
  Hex,
  isHexString,
  isObject,
} from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type RpcEndpoint = {
  failoverUrls?: string[];
  name?: string;
  networkClientId: string;
  url: string;
  type: string;
};

type NetworkConfiguration = {
  blockExplorerUrls: string[];
  chainId: Hex;
  defaultBlockExplorerUrlIndex?: number;
  defaultRpcEndpointIndex: number;
  name: string;
  nativeCurrency: string;
  rpcEndpoints: RpcEndpoint[];
};

export const version = 231;

const ROBINHOOD_CHAIN_ID: Hex = '0x1237'; // 4663
const OLD_HOSTNAME = 'robinhoodchain.blockscout.com';
const NEW_URL = 'https://robin.etherscan.io/';

/**
 * Migration 231: replace the deprecated Blockscout explorer URL for
 * Robinhood Chain with its Etherscan explorer on existing user installs.
 *
 * - Users without Robinhood Chain configured: no-op.
 * - Users who customized the explorer URL away from the deprecated
 * Blockscout host: no-op.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @param localChangedControllers - A set of controller keys that have been
 * changed by the migration.
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
    captureException(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work.
  }
}

export default migrate;

function transformState(
  state: Record<string, unknown>,
  changedLocalChangedControllers: Set<string>,
) {
  const networkControllerState = validateNetworkController(state);
  if (networkControllerState === undefined) {
    return state;
  }

  const { networkConfigurationsByChainId } = networkControllerState;
  if (!hasProperty(networkConfigurationsByChainId, ROBINHOOD_CHAIN_ID)) {
    return state;
  }

  const robinhoodConfig = networkConfigurationsByChainId[ROBINHOOD_CHAIN_ID];
  if (!isValidNetworkConfiguration(robinhoodConfig)) {
    console.warn(
      `Migration ${version}: Invalid Robinhood Mainnet network configuration, skip the migration`,
    );
    return state;
  }

  let didChange = false;
  const rewritten = robinhoodConfig.blockExplorerUrls.map((url) => {
    try {
      if (new URL(url).hostname === OLD_HOSTNAME) {
        didChange = true;
        return NEW_URL;
      }
    } catch {
      // not a valid URL, leave as-is
    }
    return url;
  });

  if (didChange) {
    robinhoodConfig.blockExplorerUrls = rewritten;
    changedLocalChangedControllers.add('NetworkController');
  }

  return state;
}

function validateNetworkController(state: Record<string, unknown>):
  | {
      networkConfigurationsByChainId: Record<Hex, unknown>;
      selectedNetworkClientId: string;
    }
  | undefined {
  if (!hasProperty(state, 'NetworkController')) {
    // Expected during upgrade-from-old-version — don't log.
    return undefined;
  }

  const networkControllerState = state.NetworkController;

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
    return false;
  }

  if (
    !hasProperty(value, 'networkConfigurationsByChainId') ||
    !isObject(value.networkConfigurationsByChainId)
  ) {
    return false;
  }

  if (
    !hasProperty(value, 'selectedNetworkClientId') ||
    typeof value.selectedNetworkClientId !== 'string'
  ) {
    return false;
  }

  return true;
}

function isValidNetworkConfiguration(
  object: unknown,
): object is NetworkConfiguration {
  return (
    isObject(object) &&
    hasProperty(object, 'chainId') &&
    typeof object.chainId === 'string' &&
    isHexString(object.chainId) &&
    hasProperty(object, 'blockExplorerUrls') &&
    Array.isArray(object.blockExplorerUrls) &&
    object.blockExplorerUrls.every((url) => typeof url === 'string')
  );
}
