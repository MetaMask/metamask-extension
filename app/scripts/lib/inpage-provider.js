const Streams = require('mississippi')
const ObjectMultiplex = require('./obj-multiplex')
const StreamProvider = require('web3-stream-provider')
const RemoteStore = require('./remote-store.js').RemoteStore

module.exports = MetamaskInpageProvider

function MetamaskInpageProvider (connectionStream) {
  const self = this

  // setup connectionStream multiplexing
  var multiStream = ObjectMultiplex()
  Streams.pipe(connectionStream, multiStream, connectionStream, function (err) {
    console.warn('MetamaskInpageProvider - lost connection to MetaMask')
    if (err) throw err
  })
  self.multiStream = multiStream

  // subscribe to metamask public config
  var publicConfigStore = remoteStoreWithLocalStorageCache('MetaMask-Config')
  var storeStream = publicConfigStore.createStream()
  Streams.pipe(storeStream, multiStream.createStream('publicConfig'), storeStream, function (err) {
    console.warn('MetamaskInpageProvider - lost connection to MetaMask publicConfig')
    if (err) throw err
  })
  self.publicConfigStore = publicConfigStore

  // connect to async provider
  var asyncProvider = new StreamProvider()
  Streams.pipe(asyncProvider, multiStream.createStream('provider'), asyncProvider, function (err) {
    console.warn('MetamaskInpageProvider - lost connection to MetaMask provider')
    if (err) throw err
  })
  asyncProvider.on('error', console.error.bind(console))
  self.asyncProvider = asyncProvider
  // handle sendAsync requests via asyncProvider
  self.sendAsync = function(payload, cb){
    // rewrite request ids
    var request = jsonrpcMessageTransform(payload, (message) => {
      message.id = createRandomId()
      return message
    })
    // forward to asyncProvider
    asyncProvider.sendAsync(request, cb)
  }
}

MetamaskInpageProvider.prototype.send = function (payload) {
  const self = this
  
  let selectedAddress
  let result = null
  switch (payload.method) {

    case 'eth_accounts':
      // read from localStorage
      selectedAddress = self.publicConfigStore.get('selectedAddress')
      result = selectedAddress ? [selectedAddress] : []
      break

    case 'eth_coinbase':
      // read from localStorage
      selectedAddress = self.publicConfigStore.get('selectedAddress')
      result = selectedAddress || '0x0000000000000000000000000000000000000000'
      break

    // throw not-supported Error
    default:
      var message = 'The MetaMask Web3 object does not support synchronous methods. See https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#all-async---think-of-metamask-as-a-light-client for details.'
      throw new Error(message)

  }

  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

MetamaskInpageProvider.prototype.sendAsync = function () {
  throw new Error('MetamaskInpageProvider - sendAsync not overwritten')
}

MetamaskInpageProvider.prototype.isConnected = function () {
  return true
}

// util

function remoteStoreWithLocalStorageCache (storageKey) {
  // read local cache
  var initState = JSON.parse(localStorage[storageKey] || '{}')
  var store = new RemoteStore(initState)
  // cache the latest state locally
  store.subscribe(function (state) {
    localStorage[storageKey] = JSON.stringify(state)
  })

  return store
}

function createRandomId(){
  const extraDigits = 3
  // 13 time digits
  const datePart = new Date().getTime() * Math.pow(10, extraDigits)
  // 3 random digits
  const extraPart = Math.floor(Math.random() * Math.pow(10, extraDigits))
  // 16 digits
  return datePart + extraPart
}

function jsonrpcMessageTransform(payload, transformFn){
  if (Array.isArray(payload)) {
    return payload.map(transformFn)
  } else {
    return transformFn(payload)
  }
}