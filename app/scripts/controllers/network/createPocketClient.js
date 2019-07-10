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
const {
  ROPSTEN,
  ROPSTEN_CODE,
  ROPSTEN_CHAINID,
  RINKEBY_CODE,
  RINKEBY_CHAINID,
  RINKEBY,
  KOVAN,
  KOVAN_CODE,
  KOVAN_CHAINID,
  MAINNET,
  MAINNET_CODE,
  MAINNET_CHAINID,
  ETH_TICK,
  POA_SOKOL,
  POA_CODE,
  POA_CHAINID,
  POA_TICK,
  POA,
  DAI,
  DAI_CODE,
  DAI_CHAINID,
  GOERLI_TESTNET,
  GOERLI_TESTNET_CODE,
  GOERLI_TESTNET_CHAINID,
  POA_SOKOL_CODE,
  POA_SOKOL_CHAINID,
} = require('./enums')

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
    case MAINNET:
      netId = MAINNET_CODE.toString()
      chainId = MAINNET_CHAINID
      ticker = ETH_TICK
      break
    case ROPSTEN:
      netId = ROPSTEN_CODE.toString()
      chainId = ROPSTEN_CHAINID
      ticker = ETH_TICK
      break
    case RINKEBY:
      netId = RINKEBY_CODE.toString()
      chainId = RINKEBY_CHAINID
      ticker = ETH_TICK
      break
    case KOVAN:
      netId = KOVAN_CODE.toString()
      chainId = KOVAN_CHAINID
      ticker = ETH_TICK
      break
    case GOERLI_TESTNET:
      netId = GOERLI_TESTNET_CODE.toString()
      chainId = GOERLI_TESTNET_CHAINID
      ticker = ETH_TICK
      break
    case POA:
      netId = POA_CODE.toString()
      chainId = POA_CHAINID
      ticker = POA_TICK
      break
    case DAI:
      netId = DAI_CODE.toString()
      chainId = DAI_CHAINID
      ticker = POA_TICK
      break
    case POA_SOKOL:
      netId= POA_SOKOL_CODE.toString()
      chainId = POA_SOKOL_CHAINID
      ticker = POA_TICK
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
