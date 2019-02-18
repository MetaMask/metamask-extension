const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const createWalletSubprovider = require('eth-json-rpc-middleware/wallet')

module.exports = createMetamaskMiddleware

function createMetamaskMiddleware ({
  version,
  getAccounts,
  processTransaction,
  processEthSignMessage,
  processTypedMessage,
  processTypedMessageV3,
  processPersonalMessage,
  getPendingNonce,
  appKey_getXPubKey,
  appKey_eth_getAddress,
  appKey_eth_signTransaction,
  appKey_eth_signTypedMessage,
}) {
  const metamaskMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      // staticSubprovider
      eth_syncing: false,
      web3_clientVersion: `MetaMask/v${version}`,
    }),
    createWalletSubprovider({
      getAccounts,
      processTransaction,
      processEthSignMessage,
      processTypedMessage,
      processTypedMessageV3,
      processPersonalMessage,
    }),
    createPendingNonceMiddleware({ getPendingNonce }),
    createAppKeyGetXPubKeyMiddleware(appKey_getXPubKey),
    createAppKeyEthGetAddressMiddleware(appKey_eth_getAddress),
    createAppKeyEthSignTransactionMiddleware(appKey_eth_signTransaction),
    createAppKeyEthSignTypedMessageMiddleware(appKey_eth_signTypedMessage)    
  ])
  return metamaskMiddleware
}


// No end in createAsyncMiddleware ?
//I would ask @aaron.davis if that’s right. I usually use the explicit `done()` call (4th param).
//I think the nonce may be unique since it’s recording the pending nonce but also allowing other middleware methods to run?
function createAppKeyGetXPubKeyMiddleware (appKey_getXPubKey) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'appKey_getXPubKey') return next()
    console.log(req)
    const hdPath = req.params[0]

    res.result = await appKey_getXPubKey(hdPath)
  })
}

function createAppKeyEthGetAddressMiddleware (appKey_eth_getAddress) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'appKey_eth_getAddress') return next()
    console.log(req)
    res.result = await appKey_eth_getAddress(req.params)
  })
}
function createAppKeyEthSignTransactionMiddleware (appKey_eth_signTransaction) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'appKey_eth_signTransaction') return next()
    console.log("middleware")
    console.log(req)
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await appKey_eth_signTransaction(fromAddress, txParams)
  })
}

function createAppKeyEthSignTypedMessageMiddleware (appKey_eth_signTypedMessage) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'appKey_eth_signTypedMessage') return next()
    console.log("middleware")
    console.log(req)
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await appKey_eth_signTypedMessage(fromAddress, txParams)
  })
}


function createPendingNonceMiddleware ({ getPendingNonce }) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'eth_getTransactionCount') return next()
    const address = req.params[0]
    const blockRef = req.params[1]
    if (blockRef !== 'pending') return next()
    res.result = await getPendingNonce(address)
  })
}
