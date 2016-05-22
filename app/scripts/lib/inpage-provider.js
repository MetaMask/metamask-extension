const HttpProvider = require('web3/lib/web3/httpprovider')
const Streams = require('mississippi')
const ObjectMultiplex = require('./obj-multiplex')
const StreamProvider = require('./stream-provider.js')
const RemoteStore = require('./remote-store.js').RemoteStore
const MetamaskConfig = require('../config.js')

module.exports = MetamaskInpageProvider


function MetamaskInpageProvider(connectionStream){
  const self = this

  // setup connectionStream multiplexing 
  var multiStream = ObjectMultiplex()
  Streams.pipe(connectionStream, multiStream, connectionStream, function(err){
    console.warn('MetamaskInpageProvider - lost connection to MetaMask')
    if (err) throw err
  })
  self.multiStream = multiStream

  // subscribe to metamask public config
  var publicConfigStore = remoteStoreWithLocalStorageCache('MetaMask-Config')
  var storeStream = publicConfigStore.createStream()
  Streams.pipe(storeStream, multiStream.createStream('publicConfig'), storeStream, function(err){
    console.warn('MetamaskInpageProvider - lost connection to MetaMask publicConfig')
    if (err) throw err
  })
  self.publicConfigStore = publicConfigStore

  // connect to sync provider
  self.syncProvider = createSyncProvider(publicConfigStore.get('provider'))
  // subscribe to publicConfig to update the syncProvider on change
  publicConfigStore.subscribe(function(state){
    self.syncProvider = createSyncProvider(state.provider)
  })

  // connect to async provider
  var asyncProvider = new StreamProvider()
  Streams.pipe(asyncProvider, multiStream.createStream('provider'), asyncProvider, function(err){
    console.warn('MetamaskInpageProvider - lost connection to MetaMask provider')
    if (err) throw err
  })
  asyncProvider.on('error', console.error.bind(console))
  self.asyncProvider = asyncProvider
  // overwrite own sendAsync method
  self.sendAsync = asyncProvider.sendAsync.bind(asyncProvider)
}

MetamaskInpageProvider.prototype.send = function(payload){
  const self = this

  var result = null
  switch (payload.method) {

    case 'eth_accounts':
      // read from localStorage
      var selectedAddress = self.publicConfigStore.get('selectedAddress')
      result = selectedAddress ? [selectedAddress] : []
      break

    case 'eth_coinbase':
      // read from localStorage
      var selectedAddress = self.publicConfigStore.get('selectedAddress')
      result = selectedAddress || '0x0000000000000000000000000000000000000000'
      break

    // fallback to normal rpc
    default:
      return self.syncProvider.send(payload)

  }

  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

MetamaskInpageProvider.prototype.sendAsync = function(){
  throw new Error('MetamaskInpageProvider - sendAsync not overwritten')
}

MetamaskInpageProvider.prototype.isConnected = function(){
  return true
}

// util

function createSyncProvider(providerConfig){
  providerConfig = providerConfig || {}
  var syncProviderUrl = undefined

  if (providerConfig.rpcTarget) {
    syncProviderUrl = providerConfig.rpcTarget
  } else {
    switch(providerConfig.type) {
      case 'testnet':
        syncProviderUrl = MetamaskConfig.network.testnet
        break
      case 'mainnet':
        syncProviderUrl = MetamaskConfig.network.mainnet
        break
      default:
        syncProviderUrl = MetamaskConfig.network.default
    }
  }
  return new HttpProvider(syncProviderUrl)
}

function remoteStoreWithLocalStorageCache(storageKey){
  // read local cache
  var initState = JSON.parse(localStorage[storageKey] || '{}')
  var store = new RemoteStore(initState)
  // cache the latest state locally
  store.subscribe(function(state){
    localStorage[storageKey] = JSON.stringify(state)
  })

  return store
}