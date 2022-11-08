import { mergeMiddleware, createScaffoldMiddleware } from 'json-rpc-engine';
import {
  createFetchMiddleware,
  createBlockRefRewriteMiddleware,
  createBlockCacheMiddleware,
  createInflightCacheMiddleware,
  createBlockTrackerInspectorMiddleware,
  providerFromMiddleware,
  createRetryOnEmptyMiddleware,
} from 'eth-json-rpc-middleware';
import { PollingBlockTracker } from 'eth-block-tracker';
import { SECOND } from '../../../../shared/constants/time';
import { BUILT_IN_NETWORKS } from '../../../../shared/constants/network';

const inTest = process.env.IN_TEST;
const blockTrackerOpts = inTest ? { pollingInterval: SECOND } : {};

export default function createJsonRpcClient({ rpcUrl, chainId, network }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...blockTrackerOpts,
    provider: blockProvider,
  });

  const networkMiddleware = mergeMiddleware([
    chainId === undefined
      ? createNetworkAndChainIdMiddleware({ network })
      : createChainIdMiddleware(chainId),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightCacheMiddleware(),
    createRetryOnEmptyMiddleware({ blockTracker, provider: blockProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ]);

  return { networkMiddleware, blockTracker };
}

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

function createChainIdMiddleware(chainId) {
  return (req, res, next, end) => {
    if (req.method === 'eth_chainId') {
      res.result = chainId;
      return end();
    }
    return next();
  };
}
