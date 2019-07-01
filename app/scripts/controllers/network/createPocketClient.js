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
const devid = 'DEVVGQ8VfHgBBet8CyowHcN'

module.exports = createPocketClient

function createPocketClient ({ network }) {
  const networkIDs = getNetworkIds({ network })
  const pocketMiddleware = createPocketMiddleware(devid, {
    netID: networkIDs.netId,
    network: networkIDs.ticker,
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
  let ticker
  switch (network) {
    case 'mainnet':
      netId = '1'
      chainId = '0x01'
      ticker = "ETH"
      break
    case 'ropsten':
      netId = '3'
      chainId = '0x03'
      ticker = "ETH"
      break
    case 'rinkeby':
      netId = '4'
      chainId = '0x04'
      ticker = "ETH"
      break
    case 'kovan':
      netId = '42'
      chainId = '0x2a'
      ticker = "ETH"
      break
    case 'goerli':
      netId = '5'
      chainId = '0x05'
      ticker = "ETH"
      break
    case 'poa':
      netId = '99'
      chainId = '0x63'
      ticker = 'POA'
      break
    case 'dai':
      netId = '100'
      chainId = '0x64'
      ticker = 'POA'
      break
    case 'sokol':
      netId= '77'
      chainId = '0x4D'
      ticker = 'POA'
      break
    default:
      throw new Error(`createPocketClient - unknown network "${network}"`)
  }
  return {
    chainId, netId, ticker
  }
}

function createNetworkAndChainIdMiddleware ({ network }) {
  const networkIds = getNetworkIds({network})

  return createScaffoldMiddleware({
    eth_chainId: networkIds.chainId,
    net_version: networkIds.netId,
  })
}
