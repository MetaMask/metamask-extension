const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const createWalletSubprovider = require('eth-json-rpc-middleware/wallet')

const namehash = require('eth-ens-namehash')

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
  appKey_eth_getPublicKey,
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
    createAppKeySubProvider(appKey_eth_getPublicKey,
    			    appKey_eth_getAddress,
    			    appKey_eth_signTransaction,
    			    appKey_eth_signTypedMessage),
    createPendingNonceMiddleware({ getPendingNonce }),
  ])
  return metamaskMiddleware
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



function createAppKeySubProvider (appKey_eth_getPublicKey,
				  appKey_eth_getAddress,
				  appKey_eth_signTransaction,
				  appKey_eth_signTypedMessage) {
  return createScaffoldMiddleware({
    'appKey_eth_getPublicKey': createAsyncMiddleware(appKeyEthGetPublicKey),
    'appKey_eth_getAddress': createAsyncMiddleware(appKeyEthGetAddress),
    'appKey_eth_signTransaction': createAsyncMiddleware(appKeyEthSignTransaction),
    'appKey_eth_signTypedMessage': createAsyncMiddleware(appKeyEthSignTypedMessage),    
  })

  function prepareHdPath(personaPath, origin, hdSubPath){
    // beginning of Path using BIP 43 and arachnid eth subpurpose space
    // Would prefer to use m/BIPNUMBER' once the app key eip is submitted as a bip
    const beginningPath = "m/43'/60'/1775'"
    const uid = namehash.hash(origin)
    const uidSubPath = splitUid(uid)
    const hdPath = beginningPath + "/" + personaPath + "/" + uidSubPath +"/"  + hdSubPath
    return hdPath
  }

  // e4a10c258c7b68c38df1cf0caf03ce2e34b5ec02e5abdd3ef18f0703f317c62a
  // e4a1/0c25/8c7b/68c3/8df1/cf0c/af03/ce2e/34b5/ec02/e5ab/dd3e/f18f/0703/f317/c62a
  // m/14249/25189/12235/29994/58227/65200/8925/10370/43316/35705

  // should be reworked to split in 8 times 31bits (can not be done with hex slicing)
  // + 1 times 8 bits
  // to reduce HD tree depth
  
  function splitUid(uid) {
    let numberOfSlices = 16
    let subPath = ""
    for (let k = 0; k < numberOfSlices; k++) {

      subPath  += parseInt(uid.slice(4*k+2, 4*(k+1)+2), 16)
      if (k != numberOfSlices - 1) {
	subPath += "'/"
      }
      if (k == numberOfSlices - 1) {
	subPath += "'"	
      }
    }
    return subPath
  }

  
  async function appKeyEthGetPublicKey(req, res) {
    const hdSubPath = req.params
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)
    res.result = await appKey_eth_getPublicKey(hdPath)
  }
  async function appKeyEthGetAddress(req, res) {
    res.result = await appKey_eth_getAddress(req.params)
  }
  async function appKeyEthSignTransaction(req, res) {
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await appKey_eth_signTransaction(fromAddress, txParams)
  }
  async function appKeyEthSignTypedMessage(req, res) {
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await appKey_eth_signTypedMessage(fromAddress, txParams)
  }

}


