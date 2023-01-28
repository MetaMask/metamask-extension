import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JsonRpcEngine,
  mergeMiddleware,
} from 'json-rpc-engine';
import {
  createBlockCacheMiddleware,
  createBlockRefMiddleware,
  createBlockRefRewriteMiddleware,
  createBlockTrackerInspectorMiddleware,
  createInflightCacheMiddleware,
  createFetchMiddleware,
  createRetryOnEmptyMiddleware,
  providerFromEngine,
  providerFromMiddleware,
} from 'eth-json-rpc-middleware';
import createFilterMiddleware from 'eth-json-rpc-filters';
import { createInfuraMiddleware } from '@metamask/eth-json-rpc-infura';
import type { Hex } from '@metamask/utils';
import createSubscriptionManager from 'eth-json-rpc-filters/subscriptionManager';
import { PollingBlockTracker } from 'eth-block-tracker';
import { SECOND } from '../../../../shared/constants/time';
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';

function createNetworkAndChainIdMiddleware({ network }) {
  if (!BUILT_IN_NETWORKS[network]) {
    throw new Error(`createInfuraClient - unknown network "${network}"`);
  }

  const { chainId, networkId } = BUILT_IN_NETWORKS[network];

  return createScaffoldMiddleware({
    eth_chainId: chainId,
    net_version: networkId,
  });
}

function createCustomNetworkMiddleware({
  blockTracker,
  chainId,
  rpcApiMiddleware,
}) {
  const testMiddlewares = process.env.IN_TEST
    ? [createEstimateGasDelayTestMiddleware()]
    : [];

  return mergeMiddleware([
    ...testMiddlewares,
    createChainIdMiddleware(chainId),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightCacheMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    rpcApiMiddleware,
  ]);
}

function createInfuraNetworkMiddleware({
  blockTracker,
  network,
  rpcProvider,
  rpcApiMiddleware,
}) {
  return mergeMiddleware([
    createNetworkAndChainIdMiddleware({ network }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightCacheMiddleware(),
    createBlockRefMiddleware({ blockTracker, provider: rpcProvider }),
    createRetryOnEmptyMiddleware({ blockTracker, provider: rpcProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    rpcApiMiddleware,
  ]);
}

enum NetworkClientType {
  CUSTOM = 'custom',
  INFURA = 'infura',
}

type CustomNetworkConfiguration = {
  chainId: Hex;
  rpcUrl: string;
  type: NetworkClientType.CUSTOM;
};

type InfuraSupportedNetwork = 'goerli' | 'mainnet' | 'sepolia';

type InfuraNetworkConfiguration = {
  network: InfuraSupportedNetwork;
  projectId: string;
  type: NetworkClientType.INFURA;
};

/**
 * Create a JSON RPC network client for a specific network.
 *
 * @param networkConfig - The network configuration.
 * @returns
 */
export function createNetworkClient(
  networkConfig: CustomNetworkConfiguration | InfuraNetworkConfiguration,
) {
  const rpcApiMiddleware =
    networkConfig.type === NetworkClientType.INFURA
      ? createInfuraMiddleware({
          network: networkConfig.network,
          projectId: networkConfig.projectId,
          maxAttempts: 5,
          source: 'metamask',
        })
      : createFetchMiddleware({ rpcUrl: networkConfig.rpcUrl });
  const rpcProvider = providerFromMiddleware(rpcApiMiddleware);

  const blockTrackerOpts =
    process.env.IN_TEST && networkConfig.type === 'custom'
      ? { pollingInterval: SECOND }
      : {};
  const blockTracker = new PollingBlockTracker({
    ...blockTrackerOpts,
    provider: rpcProvider,
  });

  const networkMiddleware =
    networkConfig.type === 'infura'
      ? createInfuraNetworkMiddleware({
          blockTracker,
          network: networkConfig.network,
          rpcProvider,
          rpcApiMiddleware,
        })
      : createCustomNetworkMiddleware({
          blockTracker,
          chainId: networkConfig.chainId,
          rpcApiMiddleware,
        });
  const networkProvider = providerFromMiddleware(networkMiddleware);

  const filterMiddleware = createFilterMiddleware({
    provider: networkProvider,
    blockTracker,
  });
  const subscriptionManager = createSubscriptionManager({
    provider: networkProvider,
    blockTracker,
  });

  const engine = new JsonRpcEngine();
  subscriptionManager.events.on('notification', (message) =>
    engine.emit('notification', message),
  );
  engine.push(filterMiddleware);
  engine.push(subscriptionManager.middleware);
  engine.push(networkMiddleware);

  const provider = providerFromEngine(engine);

  return { provider, blockTracker };
}

function createChainIdMiddleware(chainId) {
  return (req, res, next, end) => {
    if (req.method === 'eth_chainId') {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

/**
 * For use in tests only.
 * Adds a delay to `eth_estimateGas` calls.
 */
function createEstimateGasDelayTestMiddleware() {
  return createAsyncMiddleware(async (req, _, next) => {
    if (req.method === 'eth_estimateGas') {
      await new Promise((resolve) => setTimeout(resolve, SECOND * 2));
    }
    return next();
  });
}
