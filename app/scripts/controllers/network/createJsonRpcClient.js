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
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const inTest = process.env.IN_TEST;
const blockTrackerOpts = inTest ? { pollingInterval: SECOND } : {};
const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

const getBlockTimestamp = async (rpcUrl, block) => {
  const res = await fetchWithTimeout(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [`0x${block.toString(16)}`, false],
      id: 1,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return Number.parseInt((await res.json()).result.timestamp, 16) * 1000;
};

const getChainOpts = async (rpcUrl) => {
  try {
    const response = await fetchWithTimeout(rpcUrl, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const NUM_PAST = 5;
    const latestBlock = Number.parseInt((await response.json()).result, 16);
    const latestBlockTimestamp = await getBlockTimestamp(rpcUrl, latestBlock);
    const pastBlockTimestamp = await getBlockTimestamp(
      rpcUrl,
      latestBlock - NUM_PAST,
    );

    return {
      pollingInterval:
        ((latestBlockTimestamp - pastBlockTimestamp) / NUM_PAST) * 0.75,
    };
  } catch {
    return {};
  }
};

const getTestMiddlewares = () => {
  return inTest ? [createEstimateGasDelayTestMiddleware()] : [];
};

export default async function createJsonRpcClient({ rpcUrl, chainId }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...(await getChainOpts(rpcUrl)),
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
