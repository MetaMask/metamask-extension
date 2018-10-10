const EventEmitter = require('events').EventEmitter
const async = require('async')
const Dnode = require('dnode')
const Eth = require('ethjs')
const EthQuery = require('eth-query')
const launchMetamaskUi = require('../../ui')
const StreamProvider = require('web3-stream-provider')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex

module.exports = initializePopup

/**
 * Asynchronously initializes the MetaMask popup UI
 *
 * @param {{ container: Element, connectionStream: * }} config Popup configuration object
 * @param {Function} cb Called when initialization is complete
 */
function initializePopup ({ container, connectionStream }, cb) {
  // setup app
  async.waterfall([
    (cb) => connectToAccountManager(connectionStream, cb),
    (accountManager, cb) => launchMetamaskUi({ container, accountManager }, cb),
  ], cb)
}

/**
 * Establishes streamed connections to background scripts and a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream PortStream instance establishing a background connection
 * @param {Function} cb Called when controller connection is established
 */
function connectToAccountManager (connectionStream, cb) {
  // setup communication with background
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'), cb)
  setupWeb3Connection(mx.createStream('provider'))
}

/**
 * Establishes a streamed connection to a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream PortStream instance establishing a background connection
 */
function setupWeb3Connection (connectionStream) {
  var providerStream = new StreamProvider()
  providerStream.pipe(connectionStream).pipe(providerStream)
  connectionStream.on('error', console.error.bind(console))
  providerStream.on('error', console.error.bind(console))
  global.ethereumProvider = providerStream
  global.ethQuery = new EthQuery(providerStream)
  global.eth = new Eth(providerStream)
}

/**
 * Establishes a streamed connection to the background account manager
 *
 * @param {PortDuplexStream} connectionStream PortStream instance establishing a background connection
 * @param {Function} cb Called when the remote account manager connection is established
 */
function setupControllerConnection (connectionStream, cb) {
  // this is a really sneaky way of adding EventEmitter api
  // to a bi-directional dnode instance
  var eventEmitter = new EventEmitter()
  var accountManagerDnode = Dnode({
    sendUpdate: function (state) {
      eventEmitter.emit('update', state)
    },
  })
  connectionStream.pipe(accountManagerDnode).pipe(connectionStream)
  accountManagerDnode.once('remote', function (accountManager) {
    // setup push events
    accountManager.on = eventEmitter.on.bind(eventEmitter)
    cb(null, accountManager)
  })
}
