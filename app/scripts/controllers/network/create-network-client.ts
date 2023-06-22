import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JsonRpcEngine,
  mergeMiddleware,
  JsonRpcMiddleware,
} from 'json-rpc-engine';
import {
  createBlockCacheMiddleware,
  createBlockRefMiddleware,
  createBlockRefRewriteMiddleware,
  createBlockTrackerInspectorMiddleware,
  createInflightCacheMiddleware,
  createFetchMiddleware,
  createRetryOnEmptyMiddleware,
} from '@metamask/eth-json-rpc-middleware';
import {
  providerFromEngine,
  providerFromMiddleware,
  SafeEventEmitterProvider,
} from '@metamask/eth-json-rpc-provider';
import { createInfuraMiddleware } from '@metamask/eth-json-rpc-infura';
import type { Hex } from '@metamask/utils/dist';
import { PollingBlockTracker } from 'eth-block-tracker/dist';
import { SECOND } from '../../../../shared/constants/time';
import {
  BUILT_IN_INFURA_NETWORKS,
  BuiltInInfuraNetwork,
} from '../../../../shared/constants/network';

export enum NetworkClientType {
  Custom = 'custom',
  Infura = 'infura',
}

type CustomNetworkConfiguration = {
  chainId: Hex;
  rpcUrl: string;
  type: NetworkClientType.Custom;
};

type InfuraNetworkConfiguration = {
  network: BuiltInInfuraNetwork;
  infuraProjectId: string;
  type: NetworkClientType.Infura;
};

/**
 * Create a JSON RPC network client for a specific network.
 *
 * @param networkConfig - The network configuration.
 * @returns
 */
export function createNetworkClient(
  networkConfig: CustomNetworkConfiguration | InfuraNetworkConfiguration,
): { provider: SafeEventEmitterProvider; blockTracker: PollingBlockTracker } {
  const rpcApiMiddleware =
    networkConfig.type === NetworkClientType.Infura
      ? createInfuraMiddleware({
          network: networkConfig.network,
          projectId: networkConfig.infuraProjectId,
          maxAttempts: 5,
          source: 'metamask',
        })
      : createFetchMiddleware({
          btoa: global.btoa,
          fetch: global.fetch,
          rpcUrl: networkConfig.rpcUrl,
        });

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
    networkConfig.type === NetworkClientType.Infura
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

  const engine = new JsonRpcEngine();

  engine.push(networkMiddleware);

  const provider = providerFromEngine(engine);

  return { provider, blockTracker };
}

function createInfuraNetworkMiddleware({
  blockTracker,
  network,
  rpcProvider,
  rpcApiMiddleware,
}: {
  blockTracker: PollingBlockTracker;
  network: BuiltInInfuraNetwork;
  rpcProvider: SafeEventEmitterProvider;
  rpcApiMiddleware: JsonRpcMiddleware<unknown, unknown>;
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

function createNetworkAndChainIdMiddleware({
  network,
}: {
  network: BuiltInInfuraNetwork;
}) {
  if (!BUILT_IN_INFURA_NETWORKS[network]) {
    throw new Error(`createInfuraClient - unknown network "${network}"`);
  }

  const { chainId, networkId } = BUILT_IN_INFURA_NETWORKS[network];

  return createScaffoldMiddleware({
    eth_chainId: chainId,
    net_version: networkId,
  });
}

const createChainIdMiddleware = (
  chainId: string,
): JsonRpcMiddleware<unknown, unknown> => {
  return (req, res, next, end) => {
    if (req.method === 'eth_chainId') {
      res.result = chainId;
      return end();
    }
    return next();
  };
};

function createCustomNetworkMiddleware({
  blockTracker,
  chainId,
  rpcApiMiddleware,
}: {
  blockTracker: PollingBlockTracker;
  chainId: string;
  rpcApiMiddleware: any;
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
