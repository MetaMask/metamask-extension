const { inherits } = require('util')
const EventEmitter = require('events')
const pump = require('pump')
const RpcEngine = require('json-rpc-engine')
const createIdRemapMiddleware = require('json-rpc-engine/src/idRemapMiddleware')
const createStreamMiddleware = require('json-rpc-middleware-stream')
const LocalStorageStore = require('obs-store')
const asStream = require('obs-store/lib/asStream')
const ObjectMultiplex = require('obj-multiplex')
const { noop, override } = require('./util')

module.exports = MetamaskInpageProvider

inherits(MetamaskInpageProvider, EventEmitter)

function MetamaskInpageProvider (connectionStream) {
  const self = this
  EventEmitter.call(self)

  // setup connectionStream multiplexing
  const mux = self.mux = new ObjectMultiplex()
  pump(
    connectionStream,
    mux,
    connectionStream,
    (err) => logStreamDisconnectWarning('MetaMask', err)
  )

  // subscribe to metamask public config (one-way)
  self.publicConfigStore = new LocalStorageStore({ storageKey: 'MetaMask-Config' })

  pump(
    mux.createStream('publicConfig'),
    asStream(self.publicConfigStore),
    (err) => logStreamDisconnectWarning('MetaMask PublicConfigStore', err)
  )

  // ignore phishing warning message (handled elsewhere)
  mux.ignoreStream('phishing')

  // connect to async provider
  const streamMiddleware = createStreamMiddleware()
  
  override(streamMiddleware.stream, 'write', function (original) {
    return function (res, encoding, cb) {
      // eth_subscription's do not have an id, therfore cannot be remapped
      // responses should be emitted onto the web3 current provider
      if (res.method === 'eth_subscription') {
        // if has subscription registered on inpage provider, emit subscription
        // data onto the current provider
        if (self.subscriptions.indexOf(res.params.subscription) > -1) {
          self.emit('data', res)
        }
      } else {
        // call original funtion
        original.apply(this, arguments)
      }
    }
  })

  pump(
    streamMiddleware.stream,
    mux.createStream('provider'),
    streamMiddleware.stream,
    (err) => logStreamDisconnectWarning('MetaMask RpcProvider', err)
  )

  // handle sendAsync requests via dapp-side rpc engine
  const rpcEngine = new RpcEngine()
  rpcEngine.push(createIdRemapMiddleware())
  rpcEngine.push(streamMiddleware)
  self.rpcEngine = rpcEngine

  // subscription ids
  self.subscriptions = []
}

MetamaskInpageProvider.prototype._handleSubscriptionRequest = function (payload, cb) {
  const self = this
  self.rpcEngine.handle(payload, (error, response) => {
    if (error) {
      cb(error, null)
    } else {
      payload.method === 'eth_subscribe' ?
        self.subscriptions.push(response.result) :
        payload.params.forEach(p => {
          self.subscriptions = self.subscriptions.filter(s => s !== p)
        })
      cb(null, response)
    }
  })
}

MetamaskInpageProvider.prototype._handleRequest = function (payload, cb) {
  const self = this
  isSubscriptionRequest(payload) ?
    self._handleSubscriptionRequest(payload, cb) :
    self.rpcEngine.handle(payload, cb)
}

// handle sendAsync requests via asyncProvider
// also remap ids inbound and outbound
MetamaskInpageProvider.prototype.sendAsync = function (payload, cb) {
  const self = this
  self._handleRequest(payload, cb)
}

MetamaskInpageProvider.prototype.send = function (payload) {
  const self = this

  let selectedAddress
  let result = null
  switch (payload.method) {

    case 'eth_accounts':
      // read from localStorage
      selectedAddress = self.publicConfigStore.getState().selectedAddress
      result = selectedAddress ? [selectedAddress] : []
      break

    case 'eth_coinbase':
      // read from localStorage
      selectedAddress = self.publicConfigStore.getState().selectedAddress
      result = selectedAddress || null
      break

    case 'eth_uninstallFilter':
      self.sendAsync(payload, noop)
      result = true
      break

    case 'net_version':
      const networkVersion = self.publicConfigStore.getState().networkVersion
      result = networkVersion || null
      break

    // throw not-supported Error
    default:
      var link = 'https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#dizzy-all-async---think-of-metamask-as-a-light-client'
      var message = `The MetaMask Web3 object does not support synchronous methods like ${payload.method} without a callback parameter. See ${link} for details.`
      throw new Error(message)

  }

  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

MetamaskInpageProvider.prototype.isConnected = function () {
  return true
}

MetamaskInpageProvider.prototype.isMetaMask = true

// util

function logStreamDisconnectWarning (remoteLabel, err) {
  let warningMsg = `MetamaskInpageProvider - lost connection to ${remoteLabel}`
  if (err) warningMsg += '\n' + err.stack
  console.warn(warningMsg)
}

function isSubscriptionRequest (request) { return request.method === 'eth_subscribe' || request.method === 'eth_unsubscribe' }
