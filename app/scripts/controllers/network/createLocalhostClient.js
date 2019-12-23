const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createFetchMiddleware = require('@yqrashawn/eth-json-rpc-middleware/fetch')
const createBlockRefRewriteMiddleware = require('@yqrashawn/eth-json-rpc-middleware/block-ref-rewrite')
const createBlockTrackerInspectorMiddleware = require('@yqrashawn/eth-json-rpc-middleware/block-tracker-inspector')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const providerFromMiddleware = require('@yqrashawn/eth-json-rpc-middleware/providerFromMiddleware')
const BlockTracker = require('./eth-block-tracker')
const { createCfxRewriteRequestMiddle } = require('./createCfxMiddle')

const inTest = process.env.IN_TEST === 'true'

module.exports = createLocalhostClient

function createLocalhostClient () {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl: 'http://localhost:12537' })
  const blockProvider = providerFromMiddleware(fetchMiddleware)
  const blockTracker = new BlockTracker({ provider: blockProvider, pollingInterval: 1000 })

  const networkMiddleware = mergeMiddleware([
    createEstimateGasMiddleware(),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    createCfxRewriteRequestMiddle(),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker, rpcUrl: 'http://localhost:12537'}
}

function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}


function createEstimateGasMiddleware () {
  return createAsyncMiddleware(async (req, _, next) => {
    if (req.method === 'cfx_estimateGas' && inTest) {
      await delay(2000)
    }
    return next()
  })
}
