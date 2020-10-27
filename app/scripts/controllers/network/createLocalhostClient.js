import mergeMiddleware from 'json-rpc-engine/src/mergeMiddleware'
import createFetchMiddleware from '@yqrashawn/cfx-json-rpc-middleware/fetch'
import createBlockRefRewriteMiddleware from '@yqrashawn/cfx-json-rpc-middleware/block-ref-rewrite'
import createBlockTrackerInspectorMiddleware from '@yqrashawn/cfx-json-rpc-middleware/block-tracker-inspector'
import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'
import providerFromMiddleware from '@yqrashawn/cfx-json-rpc-middleware/providerFromMiddleware'
import BlockTracker from './eth-block-tracker'
import { createCfxRewriteRequestMiddleware } from './createCfxMiddleware'

const inTest = process.env.IN_TEST === 'true'

export default createLocalhostClient

function createLocalhostClient () {
  const fetchMiddleware = createFetchMiddleware({
    rpcUrl: 'http://localhost:12537',
    appendMethod: true,
  })
  const blockProvider = providerFromMiddleware(fetchMiddleware)
  const blockTracker = new BlockTracker({
    provider: blockProvider,
    pollingInterval: 1000,
  })

  const networkMiddleware = mergeMiddleware([
    createEstimateGasMiddleware(),
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    createCfxRewriteRequestMiddleware(),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker, rpcUrl: 'http://localhost:12537' }
}

function delay (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function createEstimateGasMiddleware () {
  return createAsyncMiddleware(async (req, _, next) => {
    if (req.method === 'cfx_estimateGas' && inTest) {
      await delay(2000)
    }
    return next()
  })
}
