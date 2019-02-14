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
  getPubKey,
  getXPubKey,
  signTransactionAppKey,
  signTypedMessageAppKey,
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
    createGetPubKeyMiddleware(getPubKey),
    createGetXPubKeyMiddleware(getXPubKey),
    createSignTransactionAppKeyMiddleware(signTransactionAppKey),
    createSignTypedMessageAppKeyMiddleware(signTypedMessageAppKey)    
  ])
  return metamaskMiddleware
}


// No end in createAsyncMiddleware ?
//I would ask @aaron.davis if that’s right. I usually use the explicit `done()` call (4th param).
//I think the nonce may be unique since it’s recording the pending nonce but also allowing other middleware methods to run?
function createGetXPubKeyMiddleware (getXPubKey) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'getXPubKey') return next()
    console.log(req)
    const hdPath = req.params[0]

    res.result = await getXPubKey(hdPath)
  })
}

function createGetPubKeyMiddleware (getPubKey) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'getPubKey') return next()
    console.log(req)
    res.result = await getPubKey(req.params)
  })
}
function createSignTransactionAppKeyMiddleware (signTransactionAppKey) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'signTransactionAppKey') return next()
    console.log("middleware")
    console.log(req)
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await signTransactionAppKey(fromAddress, txParams)
  })
}

function createSignTypedMessageAppKeyMiddleware (signTypedMessageAppKey) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'signTypedMessageAppKey') return next()
    console.log("middleware")
    console.log(req)
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await signTypedMessageAppKey(fromAddress, txParams)
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
