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
const devid = 'DEVO7QQqPHCK2h3cGXhh2rY'

module.exports = createPocketClient

function createPocketClient ({ network }) {
  const pocketMiddleware = createPocketMiddleware(devid, {
    netID: getNetworkIds({ network }).netId,
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

function getNetworkIds ({ network }) {
  let chainId
  let netId
  
  switch (network) {
    case 'mainnet':
      netId = '1'
      chainId = '0x01'
      break
    case 'ropsten':
      netId = '3'
      chainId = '0x03'
      break
    case 'rinkeby':
      netId = '4'
      chainId = '0x04'
      break
    case 'kovan':
      netId = '42'
      chainId = '0x2a'
      break
    case 'goerli':
      netId = '5'
      chainId = '0x05'
      break
    default:
      throw new Error(`createPocketClient - unknown network "${network}"`)
  }
  return {
    chainId, netId,
  }
}

function createNetworkAndChainIdMiddleware ({ network }) {
  const networkIds = getNetworkIds({network})

  return createScaffoldMiddleware({
    eth_chainId: networkIds.chainId,
    net_version: networkIds.netId,
  })
}
