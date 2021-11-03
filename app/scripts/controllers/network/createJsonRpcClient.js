import { createAsyncMiddleware, mergeMiddleware } from 'json-rpc-engine';
import {
  createFetchMiddleware,
  createBlockRefRewriteMiddleware,
  createBlockCacheMiddleware,
  createInflightCacheMiddleware,
  createBlockTrackerInspectorMiddleware,
  providerFromMiddleware,
} from 'eth-json-rpc-middleware';
import { PollingBlockTracker } from 'eth-block-tracker';
import { SECOND } from '../../../../shared/constants/time';

const inTest = process.env.IN_TEST;
const blockTrackerOpts = inTest ? { pollingInterval: SECOND } : {};

const pollingIntervals = {
  43113: SECOND,
  43114: SECOND,
}

const getChainOpts = (chainId) => {
  return chainId in pollingIntervals ? { pollingInterval: pollingIntervals[chainId] } : {};
}

const getTestMiddlewares = () => {
  return inTest ? [createEstimateGasDelayTestMiddleware()] : [];
};

export default function createJsonRpcClient({ rpcUrl, chainId }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...getChainOpts(chainId),
    ...blockTrackerOpts,
    provider: blockProvider,
  });

  const networkMiddleware = mergeMiddleware([
    ...getTestMiddlewares(),
    createChainIdMiddleware(chainId),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightCacheMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ]);

  return { networkMiddleware, blockTracker };
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
