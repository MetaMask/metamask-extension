const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')
const createBlockReRefMiddleware = require('eth-json-rpc-middleware/block-ref')
const createRetryOnEmptyMiddleware = require('eth-json-rpc-middleware/retryOnEmpty')
const createBlockCacheMiddleware = require('eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const createInfuraMiddleware = require('eth-json-rpc-infura')
const BlockTracker = require('eth-block-tracker')

module.exports = createInfuraClient

function createInfuraClient ({ network, onRequest }) {
  const infuraMiddleware = mergeMiddleware([
    createRequestHookMiddleware(onRequest),
    createInfuraMiddleware({ network, maxAttempts: 5, source: 'metamask' }),
  ])
  const infuraProvider = providerFromMiddleware(infuraMiddleware)
  const blockTracker = new BlockTracker({ provider: infuraProvider })

  const networkMiddleware = mergeMiddleware([
    createNetworkAndChainIdMiddleware({ network }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockReRefMiddleware({ blockTracker, provider: infuraProvider }),
    createRetryOnEmptyMiddleware({ blockTracker, provider: infuraProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    infuraMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}

function createNetworkAndChainIdMiddleware ({ network }) {
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
      throw new Error(`createInfuraClient - unknown network "${network}"`)
  }

  return createScaffoldMiddleware({
    eth_chainId: chainId,
    net_version: netId,
  })
}

function createRequestHookMiddleware (onRequest) {
  return (req, _, next) => {
    onRequest(req)
    next()
  }
}
