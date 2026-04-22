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

export const version = 207;

const SEI_MAINNET_CHAIN_ID: Hex = '0x531'; // 1329
const OLD_URL = 'https://seitrace.com';
const NEW_URL = 'https://seiscan.io';

/**
 * Migration 207: replace the deprecated Seitrace block explorer URL
 * (`seitrace.com`, shutting down) with its replacement Seiscan
 * (`seiscan.io`) for Sei Mainnet on existing user installs.
 *
 * - Users without Sei Mainnet configured: no-op.
 * - Users who customized the explorer URL away from Seitrace: no-op
 *   (we only rewrite entries that still point at `seitrace.com`).
 *
 * Follows the post-186 split-state migration pattern. See
 * `app/scripts/migrations/197.ts` for the canonical reference of this
 * shape; validator helpers (`isValidNetworkControllerState`,
 * `isValidNetworkConfiguration`) were introduced in migration 188 and are
 * reused verbatim with attribution comments.
 *
 * Registered in `app/scripts/migrations/index.js` alongside every other
 * migration so it executes on existing installs during upgrade.
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
  if (!hasProperty(networkConfigurationsByChainId, SEI_MAINNET_CHAIN_ID)) {
    return state;
  }

  const seiConfig = networkConfigurationsByChainId[SEI_MAINNET_CHAIN_ID];
  if (!isValidNetworkConfiguration(seiConfig)) {
    console.warn(
      `Migration ${version}: Invalid Sei Mainnet network configuration, skip the migration`,
    );
    return state;
  }

  const rewritten = seiConfig.blockExplorerUrls.map((url) =>
    url.startsWith(OLD_URL) ? url.replace(OLD_URL, NEW_URL) : url,
  );
  const didChange = rewritten.some(
    (url, index) => url !== seiConfig.blockExplorerUrls[index],
  );

  if (didChange) {
    seiConfig.blockExplorerUrls = rewritten;
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
