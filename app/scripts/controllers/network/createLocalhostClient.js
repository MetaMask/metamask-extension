const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createFetchMiddleware = require('eth-json-rpc-middleware/fetch')
const createBlockRefRewriteMiddleware = require('eth-json-rpc-middleware/block-ref-rewrite')
const createBlockTrackerInspectorMiddleware = require('eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const createBlockTracker = require('./createBlockTracker')

module.exports = createLocalhostClient

function createLocalhostClient ({ platform }) {
  const fetchMiddleware = createFetchMiddleware({ rpcUrl: 'http://localhost:8545/' })
  const blockProvider = providerFromMiddleware(fetchMiddleware)
  const blockTracker = createBlockTracker({ provider: blockProvider, pollingInterval: 1000 }, platform)

  const networkMiddleware = mergeMiddleware([
    createBlockRefRewriteMiddleware({ blockTracker }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    fetchMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}
