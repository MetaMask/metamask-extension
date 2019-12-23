const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createFetchMiddleware = require('@yqrashawn/eth-json-rpc-middleware/fetch')
const createBlockRefRewriteMiddleware = require('@yqrashawn/eth-json-rpc-middleware/block-ref-rewrite')
const createBlockCacheMiddleware = require('@yqrashawn/eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('@yqrashawn/eth-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('@yqrashawn/eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('@yqrashawn/eth-json-rpc-middleware/providerFromMiddleware')
const BlockTracker = require('./eth-block-tracker')
const { createCfxRewriteRequestMiddle } = require('./createCfxMiddle')

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
    createCfxRewriteRequestMiddle(),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker, rpcUrl }
}
