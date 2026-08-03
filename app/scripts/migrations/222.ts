import { RpcEndpointType } from '@metamask/network-controller';
import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { Migrate } from './types';

export const version = 222;

export const BSC_CHAIN_ID = CHAIN_IDS.BSC;
export const ZKSYNC_ERA_CHAIN_ID = CHAIN_IDS.ZKSYNC_ERA;
export const MEGAETH_CHAIN_ID = CHAIN_IDS.MEGAETH_MAINNET;
export const TEMPO_CHAIN_ID = CHAIN_IDS.TEMPO_MAINNET;

const TEMPO_DEFAULT_RPC_HOST = 'rpc.tempo.xyz';

type RpcEndpoint = {
  url: string;
  type?: unknown;
  failoverUrls?: unknown;
  [key: string]: unknown;
};

/**
 * The networks that got new QuickNode failovers configured in INFRA-3736. For
 * each one we add the QuickNode failover URL to the matching RPC endpoints of
 * the user's existing network configuration.
 *
 * - BSC, ZKsync Era and MegaETH default to Infura, so we only add the failover
 * to their Infura endpoints.
 * - Tempo defaults to its own `rpc.tempo.xyz` Custom endpoint (it is not on
 * Infura). The network controller applies `failoverUrls` to Custom endpoints
 * too, so we add the failover to the Tempo default endpoint.
 */
const FAILOVER_CONFIGS: {
  chainId: string;
  getQuickNodeUrl: () => string | undefined;
  shouldAddFailover: (rpcEndpoint: RpcEndpoint) => boolean;
}[] = [
  {
    chainId: BSC_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_BSC_URL,
    shouldAddFailover: isInfuraEndpoint,
  },
  {
    chainId: ZKSYNC_ERA_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_ZKSYNC_URL,
    shouldAddFailover: isInfuraEndpoint,
  },
  {
    chainId: MEGAETH_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_MEGAETH_URL,
    shouldAddFailover: isInfuraEndpoint,
  },
  {
    chainId: TEMPO_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_TEMPO_URL,
    shouldAddFailover: isTempoDefaultEndpoint,
  },
];

/**
 * Migration 222: add the QuickNode failover URLs (configured in INFRA-3736) to
 * the BSC, ZKsync Era, MegaETH and Tempo network configurations for users who
 * already have those networks. Users adding the networks for the first time
 * already get the failover from `FEATURED_RPCS`, so this only backfills
 * existing configurations.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly what we
 * persist to disk.
 * @param changedControllers - A set of controller keys that have been changed
 * by the migration.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  try {
    transformState(versionedData.data, changedControllers);
  } catch (error) {
    console.error(error);
    captureException(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
  }
}) satisfies Migrate;

export default migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  if (
    !hasProperty(state, 'NetworkController') ||
    !isObject(state.NetworkController) ||
    !hasProperty(state.NetworkController, 'networkConfigurationsByChainId') ||
    !isObject(state.NetworkController.networkConfigurationsByChainId)
  ) {
    return;
  }

  const { networkConfigurationsByChainId } = state.NetworkController;

  for (const {
    chainId,
    getQuickNodeUrl,
    shouldAddFailover,
  } of FAILOVER_CONFIGS) {
    const networkConfig = networkConfigurationsByChainId[chainId];
    if (
      !isObject(networkConfig) ||
      !Array.isArray(networkConfig.rpcEndpoints)
    ) {
      // User doesn't have this network (or it's malformed), nothing to migrate.
      continue;
    }

    const quickNodeUrl = getQuickNodeUrl();
    if (!quickNodeUrl) {
      // No failover URL available at build time, nothing to add for this network.
      continue;
    }

    let didChange = false;
    networkConfig.rpcEndpoints = networkConfig.rpcEndpoints.map(
      (rpcEndpoint) => {
        if (!isObject(rpcEndpoint) || typeof rpcEndpoint.url !== 'string') {
          return rpcEndpoint;
        }

        // Skip if endpoint already has failover URLs.
        if (
          Array.isArray(rpcEndpoint.failoverUrls) &&
          rpcEndpoint.failoverUrls.length > 0
        ) {
          return rpcEndpoint;
        }

        if (!shouldAddFailover(rpcEndpoint as RpcEndpoint)) {
          return rpcEndpoint;
        }

        didChange = true;
        return {
          ...rpcEndpoint,
          failoverUrls: [quickNodeUrl],
        };
      },
    );

    if (didChange) {
      changedControllers.add('NetworkController');
    }
  }
}

/**
 * Checks if an RPC endpoint is an Infura endpoint. Uses the parsed URL host so
 * `.infura.io` can only match the hostname, never a path segment.
 *
 * @param rpcEndpoint - The RPC endpoint to check.
 * @returns True if the endpoint is an Infura endpoint.
 */
function isInfuraEndpoint(rpcEndpoint: RpcEndpoint): boolean {
  if (rpcEndpoint.type === RpcEndpointType.Infura) {
    return true;
  }

  try {
    const { host, pathname } = new URL(rpcEndpoint.url);
    return host.endsWith('.infura.io') && pathname.startsWith('/v3/');
  } catch {
    return false;
  }
}

/**
 * Checks if an RPC endpoint is the Tempo default endpoint (`rpc.tempo.xyz`).
 *
 * @param rpcEndpoint - The RPC endpoint to check.
 * @returns True if the endpoint is the Tempo default endpoint.
 */
function isTempoDefaultEndpoint(rpcEndpoint: RpcEndpoint): boolean {
  try {
    return new URL(rpcEndpoint.url).host === TEMPO_DEFAULT_RPC_HOST;
  } catch {
    return false;
  }
}
