const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createBlockReEmitMiddleware = require('eth-json-rpc-middleware/block-reemit')
const createBlockCacheMiddleware = require('eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const createInfuraMiddleware = require('eth-json-rpc-infura')
const BlockTracker = require('eth-block-tracker')

module.exports = createInfuraClient

function createInfuraClient ({ network }) {
  const infuraMiddleware = createInfuraMiddleware({ network })
  const blockProvider = providerFromMiddleware(infuraMiddleware)
  const blockTracker = new BlockTracker({ provider: blockProvider })

  const networkMiddleware = mergeMiddleware([
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockReEmitMiddleware({ blockTracker, provider: blockProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    infuraMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}
