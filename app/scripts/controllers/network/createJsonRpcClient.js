import mergeMiddleware from 'json-rpc-engine/src/mergeMiddleware'
import createFetchMiddleware from '@yqrashawn/cfx-json-rpc-middleware/fetch'
import createBlockRefRewriteMiddleware from '@yqrashawn/cfx-json-rpc-middleware/block-ref-rewrite'
import createBlockCacheMiddleware from '@yqrashawn/cfx-json-rpc-middleware/block-cache'
import createInflightMiddleware from '@yqrashawn/cfx-json-rpc-middleware/inflight-cache'
import createBlockTrackerInspectorMiddleware from '@yqrashawn/cfx-json-rpc-middleware/block-tracker-inspector'
import providerFromMiddleware from '@yqrashawn/cfx-json-rpc-middleware/providerFromMiddleware'
import BlockTracker from './eth-block-tracker'
import { createCfxRewriteRequestMiddleware } from './createCfxMiddleware'
import { createBase32AddressMiddleware } from './createBase32AddressMiddleware'

export default createJsonRpcClient

function createJsonRpcClient({ rpcUrl, networkId }) {
  const fetchMiddleware = createFetchMiddleware({
    rpcUrl,
    appendMethod: true,
  })
  const blockProvider = providerFromMiddleware(fetchMiddleware)
  const blockTracker = new BlockTracker({ provider: blockProvider })

  const networkMiddleware = mergeMiddleware([
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    createCfxRewriteRequestMiddleware(),
    createBase32AddressMiddleware(networkId),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker, rpcUrl }
}
