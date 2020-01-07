const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createFetchMiddleware = require('@yqrashawn/cfx-json-rpc-middleware/fetch')
const createBlockRefRewriteMiddleware = require('@yqrashawn/cfx-json-rpc-middleware/block-ref-rewrite')
const createBlockCacheMiddleware = require('@yqrashawn/cfx-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('@yqrashawn/cfx-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('@yqrashawn/cfx-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('@yqrashawn/cfx-json-rpc-middleware/providerFromMiddleware')
const BlockTracker = require('./eth-block-tracker')
const { createCfxRewriteRequestMiddleware } = require('./createCfxMiddleware')

module.exports = createJsonRpcClient

function createJsonRpcClient ({ rpcUrl }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl })
  const blockProvider = providerFromMiddleware(fetchMiddleware)
  const blockTracker = new BlockTracker({ provider: blockProvider })

  const networkMiddleware = mergeMiddleware([
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    createCfxRewriteRequestMiddleware(),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker, rpcUrl }
}
