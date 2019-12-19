const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createFetchMiddleware = require('eth-json-rpc-middleware/fetch')
const createBlockRefRewriteMiddleware = require('eth-json-rpc-middleware/block-ref-rewrite')
const createBlockCacheMiddleware = require('eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const BlockTracker = require('eth-block-tracker')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

module.exports = createJsonRpcClient

function createCfxRewriteRequestMiddle() {
  return createAsyncMiddleware(async (req, res, next) => {
    if(req) {
      console.log("conflux_debug", req.method)
    }
    if(req && req.method) {
      req.method = req.method.replace("eth_", "cfx_")
      req.method = req.method.replace("getBlockByNumber", "getBlockByEpochNumber")
      req.method = req.method.replace("cfx_blockNumber", "cfx_epochNumber")
    }
    return next();
  })
}

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
