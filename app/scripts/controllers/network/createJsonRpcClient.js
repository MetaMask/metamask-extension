import { createScaffoldMiddleware, mergeMiddleware } from 'json-rpc-engine';
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

export default function createJsonRpcClient({ rpcUrl, chainId, networkId }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...blockTrackerOpts,
    provider: blockProvider,
  });

  const scaffolded = {
    eth_chainId: chainId,
  };

  if (networkId) {
    scaffolded.net_version = networkId;
  }

  const networkMiddleware = mergeMiddleware([
    createScaffoldMiddleware(scaffolded),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightCacheMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ]);

  return { networkMiddleware, blockTracker };
}
