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
  appKey_eth_signMessage,
  appKey_eth_signTransaction,
  appKey_eth_signTypedMessage,
  appKey_stark_signMessage
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
			    appKey_eth_signMessage,
    			    appKey_eth_signTransaction,
    			    appKey_eth_signTypedMessage,
			    appKey_stark_signMessage),
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
				  appKey_eth_signMessage,
				  appKey_eth_signTransaction,
				  appKey_eth_signTypedMessage,
				  appKey_stark_signMessage) {
  return createScaffoldMiddleware({
    'appKey_eth_getPublicKey': createAsyncMiddleware(appKeyEthGetPublicKey),
    'appKey_eth_getAddress': createAsyncMiddleware(appKeyEthGetAddress),
    'appKey_eth_signMessage': createAsyncMiddleware(appKeyEthSignMessage),
    'appKey_eth_signTransaction': createAsyncMiddleware(appKeyEthSignTransaction),
    'appKey_eth_signTypedMessage': createAsyncMiddleware(appKeyEthSignTypedMessage),
    'appKey_stark_signMessage': createAsyncMiddleware(appKeyStarkSignMessage),    
  })

  function prepareHdPath(personaPath, origin, hdSubPath){
    // beginning of Path using BIP 43 and arachnid eth subpurpose space
    // Would prefer to use m/BIPNUMBER' once the app key eip is submitted as a bip
    const beginningPath = "m/43'/60'/1775'"

    // need to handle the origin for ENS access and for plugins (MetaMask)
    // origin = "foo.bar.eth"
    

    const uid = namehash.hash(origin)
    const binUid = bits256HexToBin(uid)
    console.log(binUid)
    const uidSubPath = splitBinUid(binUid)
    console.log(uidSubPath)    
    const hdPath = beginningPath + "/" + personaPath + "/" + uidSubPath +"/"  + hdSubPath
    
    console.log(hdPath)
    
    return hdPath
  }

  function bits256HexToBin(hex){

    // strip and slice hex prefixed string to be under parseInt limit
    // (under 53 bits, so we can slice 6 bytes ie 48 bits, so 12 chars)

    // to slice 32 bytes (256 bits), we need:
    // 5 slices * 48 bits = 240
    // 1 slice * 16 bits

    console.log(hex)
    console.log(hex.length)    
    let bin = ""
    for (let k = 0; k < 6; k++){
      const subHex = hex.slice(2 + 12 * k, 12 * ( k + 1 ) + 2)
      console.log(subHex)
      console.log(subHex.length)          
      let subBits = parseInt(subHex, 16).toString(2)
      if (k < 5){
	subBits = subBits.padStart(48,"0")
      }
      else {
	subBits = subBits.padStart(16,"0")	
      }
      console.log(subBits)
      console.log(subBits.length)      
      bin += subBits
    }
    return (bin)
  }

  function splitBinUid(binUid) {

    // 256 bits binUid
    // sliced as:
    // 8 * 31 bits = 248    ==> 31 bits represented by 4 bytes, 32 bits, so 8 chars hex
    // 1 * 8 bits           ==> 1 byte, so 2 chars hex
    
    console.log(binUid.length)
    let numberOfSlices = 9
    let subPath = ""
    for (let k = 0; k < numberOfSlices; k++) {
      if (k != numberOfSlices - 1) {
	const binSlice = binUid.slice(31*k, 31*(k+1))
	console.log(binSlice)
	subPath  += parseInt(binSlice, 2)
	subPath += "'/"
      }
      if (k == numberOfSlices - 1) {
	const binSlice = binUid.slice(31*k, 31 * k + 8)
	console.log(binSlice)
	subPath  += parseInt(binSlice, 2)
	subPath += "'"	
      }
    }
    return subPath
  }


  // personaPath should be some option selected in Metamask itself

  async function appKeyEthGetPublicKey(req, res) {
    const hdSubPath = req.params
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)
    res.result = await appKey_eth_getPublicKey(hdPath)
  }

  async function appKeyEthGetAddress(req, res) {
    const hdSubPath = req.params    
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)    
    res.result = await appKey_eth_getAddress(req.params)
  }

  async function appKeyEthSignMessage(req, res) {
    const hdSubPath = req.params[0]
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)    
    const message = req.params[1]
    res.result = await appKey_eth_signMessage(hdPath, message)
  }

  async function appKeyEthSignTransaction(req, res) {
    const hdSubPath = req.params[0]
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)    
    const txParams = req.params[1]
    res.result = await appKey_eth_signTransaction(hdPath, txParams)
  }
  
  async function appKeyEthSignTypedMessage(req, res) {
    const hdSubPath = req.params[0]
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)    
    const txParams = req.params[1]
    res.result = await appKey_eth_signTypedMessage(hdPath, txParams)
  }

  async function appKeyStarkSignMessage(req, res) {
    const hdSubPath = req.params[0]
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)    
    const message = req.params[1]
    res.result = await appKey_stark_signMessage(hdPath, message)
  }
  
}


