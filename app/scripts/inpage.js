cleanContextForImports()
const createPayload = require('web3-provider-engine/util/create-payload')
const StreamProvider = require('./lib/stream-provider.js')
const LocalMessageDuplexStream = require('./lib/local-message-stream.js')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const RemoteStore = require('./lib/remote-store.js').RemoteStore
const Web3 = require('web3')
const once = require('once')
restoreContextAfterImports()

// rename on window
delete window.Web3
window.MetamaskWeb3 = Web3

const DEFAULT_RPC_URL = 'https://rpc.metamask.io/'


//
// setup plugin communication
//

// setup background connection
var pluginStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})
var mx = setupMultiplex(pluginStream)

// connect to provider
var remoteProvider = new StreamProvider()
remoteProvider.pipe(mx.createStream('provider')).pipe(remoteProvider)
remoteProvider.on('error', console.error.bind(console))

// subscribe to metamask public config
var initState = JSON.parse(localStorage['MetaMask-Config'] || '{}')
var publicConfigStore = new RemoteStore(initState)
var storeStream = publicConfigStore.createStream()
storeStream.pipe(mx.createStream('publicConfig')).pipe(storeStream)
publicConfigStore.subscribe(function(state){
  localStorage['MetaMask-Config'] = JSON.stringify(state)
})

//
// setup web3
//

var web3 = new Web3(remoteProvider)
web3.setProvider = function(){
  console.log('MetaMask - overrode web3.setProvider')
}
console.log('MetaMask - injected web3')

//
// automatic dapp reset
//

// export web3 as a global, checking for usage
var pageIsUsingWeb3 = false
var resetWasRequested = false
window.web3 = ensnare(web3, once(function(){
  // if web3 usage happened after a reset request, trigger reset late
  if (resetWasRequested) return triggerReset()
  // mark web3 as used
  pageIsUsingWeb3 = true
  // reset web3 reference
  window.web3 = web3
}))

// listen for reset requests
mx.createStream('control').once('data', function(){
  resetWasRequested = true
  // ignore if web3 was not used
  if (!pageIsUsingWeb3) return
  // reload after short timeout
  triggerReset()
})

function triggerReset(){
  setTimeout(function(){
    window.location.reload()
  }, 500)
}

//
// handle synchronous requests
//

global.publicConfigStore = publicConfigStore

// set web3 defaultAcount
publicConfigStore.subscribe(function(state){
  web3.eth.defaultAccount = state.selectedAddress
})

// setup sync http provider
var providerConfig = publicConfigStore.get('provider') || {}
var providerUrl = providerConfig.rpcTarget ? providerConfig.rpcTarget : DEFAULT_RPC_URL
var syncProvider = new Web3.providers.HttpProvider(providerUrl)
publicConfigStore.subscribe(function(state){
  if (!state.provider) return
  if (!state.provider.rpcTarget || state.provider.rpcTarget === providerUrl) return
  providerUrl = state.provider.rpcTarget
  syncProvider = new Web3.providers.HttpProvider(providerUrl)
})

// handle sync methods
remoteProvider.send = function(payload){
  var result = null
  switch (payload.method) {

    case 'eth_accounts':
      // read from localStorage
      var selectedAddress = publicConfigStore.get('selectedAddress')
      result = selectedAddress ? [selectedAddress] : []
      break

    case 'eth_coinbase':
      // read from localStorage
      var selectedAddress = publicConfigStore.get('selectedAddress')
      result = selectedAddress || '0x0000000000000000000000000000000000000000'
      break

    // fallback to normal rpc
    default:
      return syncProvider.send(payload)

  }

  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}


//
// util
//

// creates a proxy object that calls cb everytime the obj's properties/fns are accessed
function ensnare(obj, cb){
  var proxy = {}
  Object.keys(obj).forEach(function(key){
    var val = obj[key]
    switch (typeof val) {
      case 'function':
        proxy[key] = function(){
          cb()
          val.apply(obj, arguments)
        }
        return
      default:
        Object.defineProperty(proxy, key, {
          get: function(){ cb(); return obj[key] },
          set: function(val){ cb(); return obj[key] = val },
        })
        return
    }
  })
  return proxy
}

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
var __define = undefined

function cleanContextForImports(){
  __define = global.define
  delete global.define
}

function restoreContextAfterImports(){
  global.define = __define
}
