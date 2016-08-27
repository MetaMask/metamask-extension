const ZeroClientProvider = require('web3-provider-engine/zero')
const ParentStream = require('iframe-stream').ParentStream
const handleRequestsFromStream = require('web3-stream-provider/handler')
const Streams = require('mississippi')
const ObjectMultiplex = require('../app/scripts/lib/obj-multiplex')

console.log('yes, this is iframe')

initializeZeroClient()


function initializeZeroClient() {

  var provider = ZeroClientProvider({
    // rpcUrl: configManager.getCurrentRpcAddress(),
    rpcUrl: 'https://morden.infura.io/',
    // account mgmt
    // getAccounts: function(cb){
    //   var selectedAddress = idStore.getSelectedAddress()
    //   var result = selectedAddress ? [selectedAddress] : []
    //   cb(null, result)
    // },
    getAccounts: function(cb){
      cb(null, ['0x8F331A98aC5C9431d04A5d6Bf8Fa84ed7Ed439f3'.toLowerCase()])
    },
    // tx signing
    // approveTransaction: addUnconfirmedTx,
    // signTransaction: idStore.signTransaction.bind(idStore),
    signTransaction: function(txParams, cb){
      var privKey = new Buffer('7ef33e339ba5a5af0e57fa900ad0ae53deaa978c21ef30a0947532135eb639a8', 'hex')
      var Transaction = require('ethereumjs-tx')
      console.log('signing tx:', txParams)
      txParams.gasLimit = txParams.gas
      var tx = new Transaction(txParams)
      tx.sign(privKey)
      var serialiedTx = '0x'+tx.serialize().toString('hex')
      cb(null, serialiedTx)
    },
    // msg signing
    // approveMessage: addUnconfirmedMsg,
    // signMessage: idStore.signMessage.bind(idStore),
  })

  provider.on('block', function(block){
    console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
  })

  var connectionStream = new ParentStream()
  // setup connectionStream multiplexing 
  var multiStream = ObjectMultiplex()
  Streams.pipe(connectionStream, multiStream, connectionStream, function(err){
    console.warn('MetamaskIframe - lost connection to Dapp')
    if (err) throw err
  })

  multiStream.on('data', function(chunk){ console.log(chunk) })

  var providerStream = multiStream.createStream('provider')
  handleRequestsFromStream(providerStream, provider, logger)

  function logger(err, request, response){
    if (err) return console.error(err.stack)
    if (!request.isMetamaskInternal) {
      console.log('MetaMaskIframe - RPC complete:', request, '->', response)
      if (response.error) console.error('Error in RPC response:\n'+response.error.message)
    }
  }

}