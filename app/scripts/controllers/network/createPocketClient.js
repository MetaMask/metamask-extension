const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')
const createBlockReRefMiddleware = require('eth-json-rpc-middleware/block-ref')
const createRetryOnEmptyMiddleware = require('eth-json-rpc-middleware/retryOnEmpty')
const createBlockCacheMiddleware = require('eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const createPocketMiddleware = require('json-rpc-pocket')
const BlockTracker = require('eth-block-tracker')
const { getNetworkID } = require('../../../../old-ui/app/util')
const devid = 'DEVVGQ8VfHgBBet8CyowHcN'

module.exports = createPocketClient

function createPocketClient ({ network }) {
  const networkID = getNetworkID({ network })
  const pocketMiddleware = createPocketMiddleware(devid, {
    netID: networkID.netId,
    network: networkID.ticker,
  })
  const pocketProvider = providerFromMiddleware(pocketMiddleware)
  const blockTracker = new BlockTracker({ provider: pocketProvider })

  const networkMiddleware = mergeMiddleware([
    createNetworkAndChainIdMiddleware({ network }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockReRefMiddleware({ blockTracker, provider: pocketProvider }),
    createRetryOnEmptyMiddleware({ blockTracker, provider: pocketProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    pocketMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}

function createNetworkAndChainIdMiddleware ({ network }) {
  const networkID = getNetworkID({network})

  return createScaffoldMiddleware({
    eth_chainId: networkID.chainId,
    net_version: networkID.netId,
  })
}
