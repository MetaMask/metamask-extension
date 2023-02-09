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
import createFilterMiddleware from 'eth-json-rpc-filters';
import { createInfuraMiddleware } from '@metamask/eth-json-rpc-infura';
import createSubscriptionManager from 'eth-json-rpc-filters/subscriptionManager';
import type { Hex } from '@metamask/utils/dist';
import { PollingBlockTracker } from 'eth-block-tracker/dist';
import type { InfuraJsonRpcSupportedNetwork } from '@metamask/eth-json-rpc-infura/dist/types';
import { SECOND } from '../../../../shared/constants/time';
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';

type RpcPayload<P> = {
  id: unknown;
  jsonrpc: unknown;
  method: unknown;
  params?: P;
};

type RpcResponse<Y extends RpcPayload<any>, V> = {
  id: Y['id'];
  jsonrpc: Y['jsonrpc'];
  result: V | undefined;
  error?: {
    message: unknown;
    code: number;
  };
};

function createNetworkAndChainIdMiddleware({
  network,
}: {
  network: InfuraSupportedNetwork;
}) {
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

function createInfuraNetworkMiddleware({
  blockTracker,
  network,
  rpcProvider,
  rpcApiMiddleware,
}: {
  blockTracker: PollingBlockTracker;
  network: InfuraSupportedNetwork;
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

export enum NetworkClientType {
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
  infuraProjectId: string;
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
): { provider: SafeEventEmitterProvider; blockTracker: PollingBlockTracker } {
  /* eslint-disable @typescript-eslint/no-require-imports,@typescript-eslint/no-shadow */
  const fetch = global.fetch || require('node-fetch');
  const btoa = global.btoa || require('btoa');

  const rpcApiMiddleware: JsonRpcMiddleware<unknown, unknown> =
    networkConfig.type === NetworkClientType.INFURA
      ? createInfuraMiddleware({
          // InfuraSupportedNetwork is a subset of InfuraJsonRpcSupportedNetwork
          network: networkConfig.network as InfuraJsonRpcSupportedNetwork,
          projectId: networkConfig.infuraProjectId,
          maxAttempts: 5,
          source: 'metamask',
        })
      : createFetchMiddleware({ btoa, fetch, rpcUrl: networkConfig.rpcUrl });

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
    networkConfig.type === NetworkClientType.INFURA
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
  subscriptionManager.events.on('notification', (message: string) =>
    engine.emit('notification', message),
  );
  engine.push(filterMiddleware);
  engine.push(subscriptionManager.middleware);
  engine.push(networkMiddleware);

  const provider = providerFromEngine(engine);

  return { provider, blockTracker };
}

function createChainIdMiddleware(chainId: string) {
  return (
    req: RpcPayload<any>,
    res: RpcResponse<RpcPayload<any>, any>,
    next: () => Promise<void>,
    end: () => Promise<void>,
  ) => {
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
