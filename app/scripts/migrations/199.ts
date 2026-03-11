import {
  hasProperty,
  isObject,
  type Hex,
  isHexString,
  getErrorMessage,
} from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';
import { captureException } from '../../../shared/lib/sentry';
import { infuraProjectId } from '../../../shared/constants/network';

export const version = 199;

/**
 * Map of featured network chain IDs to their Infura RPC subdomain and
 * QuickNode failover environment variable name.
 */
export const FEATURED_INFURA_NETWORKS: Record<
  string,
  { infuraSubdomain: string; quicknodeEnvVar: string }
> = {
  '0xe708': {
    infuraSubdomain: 'linea-mainnet',
    quicknodeEnvVar: 'QUICKNODE_LINEA_MAINNET_URL',
  },
  '0xa4b1': {
    infuraSubdomain: 'arbitrum-mainnet',
    quicknodeEnvVar: 'QUICKNODE_ARBITRUM_URL',
  },
  '0xa86a': {
    infuraSubdomain: 'avalanche-mainnet',
    quicknodeEnvVar: 'QUICKNODE_AVALANCHE_URL',
  },
  '0x38': {
    infuraSubdomain: 'bsc-mainnet',
    quicknodeEnvVar: 'QUICKNODE_BSC_URL',
  },
  '0xa': {
    infuraSubdomain: 'optimism-mainnet',
    quicknodeEnvVar: 'QUICKNODE_OPTIMISM_URL',
  },
  '0x89': {
    infuraSubdomain: 'polygon-mainnet',
    quicknodeEnvVar: 'QUICKNODE_POLYGON_URL',
  },
  '0x531': {
    infuraSubdomain: 'sei-mainnet',
    quicknodeEnvVar: 'QUICKNODE_SEI_URL',
  },
  '0x8f': {
    infuraSubdomain: 'monad-mainnet',
    quicknodeEnvVar: 'QUICKNODE_MONAD_URL',
  },
  '0x2105': {
    infuraSubdomain: 'base-mainnet',
    quicknodeEnvVar: 'QUICKNODE_BASE_URL',
  },
  '0x10e6': {
    infuraSubdomain: 'megaeth-mainnet',
    quicknodeEnvVar: '',
  },
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

/**
 * This migration injects the Infura RPC endpoint into featured networks
 * that are missing it. This fixes state for users who manually re-added
 * a deleted featured network without the Infura endpoint.
 *
 * HyperEVM (0x3e7) is excluded as it was already handled by migration 197.
 *
 * @param versionedData - Versioned MetaMask extension state.
 * @param versionedData.meta - The metadata object.
 * @param versionedData.meta.version - The current migration version.
 * @param versionedData.data - The state data keyed by controller name.
 * @param localChangedControllers - A set of controller keys modified by the migration.
 */
export async function migrate(
  versionedData: { meta: { version: number }; data: Record<string, unknown> },
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
  }
}

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
) {
  const networkControllerState = validateNetworkController(state);
  if (networkControllerState === undefined) {
    return;
  }

  if (!infuraProjectId) {
    captureException(
      new Error(
        `Migration ${version}: Infura project ID is not set, skipping migration`,
      ),
    );
    return;
  }

  const { networkConfigurationsByChainId } = networkControllerState;
  let modified = false;

  for (const [chainId, config] of Object.entries(FEATURED_INFURA_NETWORKS)) {
    if (!hasProperty(networkConfigurationsByChainId, chainId)) {
      continue;
    }

    const networkConfig = networkConfigurationsByChainId[chainId];
    if (!isValidNetworkConfiguration(networkConfig)) {
      continue;
    }

    const infuraUrl = `https://${config.infuraSubdomain}.infura.io/v3/${infuraProjectId}`;
    const infuraHost = `https://${config.infuraSubdomain}.infura.io/`;
    const hasInfura = networkConfig.rpcEndpoints.some((ep) =>
      ep.url.startsWith(infuraHost),
    );

    if (!hasInfura) {
      const failoverUrl = config.quicknodeEnvVar
        ? process.env[config.quicknodeEnvVar]
        : undefined;

      networkConfig.rpcEndpoints.unshift({
        failoverUrls: failoverUrl ? [failoverUrl] : [],
        networkClientId: v4(),
        type: 'custom',
        url: infuraUrl,
      });
      networkConfig.defaultRpcEndpointIndex += 1;
      modified = true;
    }
  }

  if (modified) {
    changedControllers.add('NetworkController');
  }
}

function validateNetworkController(state: Record<string, unknown>):
  | {
      networkConfigurationsByChainId: Record<Hex, unknown>;
      selectedNetworkClientId: string;
    }
  | undefined {
  if (!hasProperty(state, 'NetworkController')) {
    captureException(
      new Error(`Migration ${version}: Missing NetworkController state`),
    );
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
    captureException(
      new Error(
        `Migration ${version}: NetworkController state is not an object`,
      ),
    );
    return false;
  }

  if (!hasProperty(value, 'networkConfigurationsByChainId')) {
    captureException(
      new Error(`Migration ${version}: Missing networkConfigurationsByChainId`),
    );
    return false;
  }

  if (
    !isObject(value.networkConfigurationsByChainId) ||
    !Object.keys(value.networkConfigurationsByChainId).every(
      (k) => typeof k === 'string' && isHexString(k),
    )
  ) {
    captureException(
      new Error(`Migration ${version}: Invalid networkConfigurationsByChainId`),
    );
    return false;
  }

  if (!hasProperty(value, 'selectedNetworkClientId')) {
    captureException(
      new Error(`Migration ${version}: Missing selectedNetworkClientId`),
    );
    return false;
  }

  if (typeof value.selectedNetworkClientId !== 'string') {
    captureException(
      new Error(
        `Migration ${version}: selectedNetworkClientId is not a string`,
      ),
    );
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
    hasProperty(object, 'rpcEndpoints') &&
    Array.isArray(object.rpcEndpoints) &&
    object.rpcEndpoints.every(
      (ep) =>
        isObject(ep) && hasProperty(ep, 'url') && typeof ep.url === 'string',
    ) &&
    hasProperty(object, 'defaultRpcEndpointIndex') &&
    typeof object.defaultRpcEndpointIndex === 'number'
  );
}
