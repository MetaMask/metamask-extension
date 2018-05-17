const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const createFetchMiddleware = require('eth-json-rpc-middleware/fetch')
const createBlockRefMiddleware = require('eth-json-rpc-middleware/block-ref')
const createBlockCacheMiddleware = require('eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const BlockTracker = require('eth-block-tracker')

module.exports = createJsonRpcClient

function createJsonRpcClient ({ rpcUrl }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl })
  const blockProvider = providerFromMiddleware(fetchMiddleware)
  const blockTracker = new BlockTracker({ provider: blockProvider })

  const networkMiddleware = mergeMiddleware([
    createBlockRefMiddleware({ blockTracker }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}

// inspect if response contains a block ref higher than our latest block
const futureBlockRefRequests = ['eth_getTransactionByHash', 'eth_getTransactionReceipt']
function createBlockTrackerInspectorMiddleware ({ blockTracker }) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (!futureBlockRefRequests.includes(req.method)) return next()
    await next()
    const blockNumber = Number.parseInt(res.result.blockNumber, 16)
    const currentBlockNumber = Number.parseInt(blockTracker.getCurrentBlock(), 16)
    if (blockNumber > currentBlockNumber) await blockTracker.checkForLatestBlock()
  })
}
