const pipe = require('pump')
const RpcEngine = require('json-rpc-engine')
const createStreamMiddleware = require('json-rpc-middleware-stream')
const LocalStorageStore = require('obs-store')
const ObjectMultiplex = require('./obj-multiplex')

module.exports = MetamaskInpageProvider

function MetamaskInpageProvider (connectionStream) {
  const self = this

  // setup connectionStream multiplexing
  var multiStream = self.multiStream = ObjectMultiplex()
  pipe(
    connectionStream,
    multiStream,
    connectionStream,
    (err) => logStreamDisconnectWarning('MetaMask', err)
  )

  // subscribe to metamask public config (one-way)
  self.publicConfigStore = new LocalStorageStore({ storageKey: 'MetaMask-Config' })
  pipe(
    multiStream.createStream('publicConfig'),
    self.publicConfigStore,
    (err) => logStreamDisconnectWarning('MetaMask PublicConfigStore', err)
  )

  // ignore phishing warning message (handled elsewhere)
  multiStream.ignoreStream('phishing') 

  // connect to async provider
  const streamMiddleware = createStreamMiddleware()
  pipe(
    streamMiddleware.stream,
    multiStream.createStream('provider'),
    streamMiddleware.stream,
    (err) => logStreamDisconnectWarning('MetaMask RpcProvider', err)
  )
  // start and stop polling to unblock first block lock

  // handle sendAsync requests via dapp-side rpc engine
  const engine = new RpcEngine()
  engine.push(streamMiddleware)

  self.sendAsync = engine.handle.bind(engine)
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
      result = selectedAddress
      break

    case 'eth_uninstallFilter':
      self.sendAsync(payload, noop)
      result = true
      break

    case 'net_version':
      const networkVersion = self.publicConfigStore.getState().networkVersion
      result = networkVersion
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

MetamaskInpageProvider.prototype.sendAsync = function () {
  throw new Error('MetamaskInpageProvider - sendAsync not overwritten')
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

function noop () {}
