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

export const version = 232;

const TEMPO_CHAIN_ID: Hex = '0x1079'; // 4217 Tempo Mainnet
const OLD_CURRENCY = 'pathUSD';
const NEW_CURRENCY = 'USD';

/**
 * Migration 232: Tempo has no native currency; USD is used as a placeholder.
 * The mm-config-registry integration briefly set pathUSD for newly added Tempo
 * networks. This migration reverts that for affected users.
 *
 * Behavior:
 * - Users for which Tempo native currency is 'pathUSD' -> Switch to 'USD'.
 * - Users for which Tempo native currency is something else: no-op.
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
  if (!hasProperty(networkConfigurationsByChainId, TEMPO_CHAIN_ID)) {
    return state;
  }

  const tempoConfig = networkConfigurationsByChainId[TEMPO_CHAIN_ID];
  if (!isValidNetworkConfiguration(tempoConfig)) {
    console.warn(
      `Migration ${version}: Invalid Tempo Mainnet network configuration, skip the migration`,
    );
    return state;
  }

  if (tempoConfig.nativeCurrency === OLD_CURRENCY) {
    tempoConfig.nativeCurrency = NEW_CURRENCY;
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
    hasProperty(object, 'nativeCurrency') &&
    typeof object.nativeCurrency === 'string'
  );
}
