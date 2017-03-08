const EventEmitter = require('events').EventEmitter
const Dnode = require('dnode')
const Web3 = require('web3')
const MetaMaskUi = require('../../ui')
const StreamProvider = require('web3-stream-provider')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex


module.exports = initializePopup


function initializePopup (connectionStream) {
  // setup app
  connectToAccountManager(connectionStream, setupApp)
}

function connectToAccountManager (connectionStream, cb) {
  // setup communication with background
  // setup multiplexing
  var mx = setupMultiplex(connectionStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'), cb)
  setupWeb3Connection(mx.createStream('provider'))
}

function setupWeb3Connection (connectionStream) {
  var providerStream = new StreamProvider()
  providerStream.pipe(connectionStream).pipe(providerStream)
  connectionStream.on('error', console.error.bind(console))
  providerStream.on('error', console.error.bind(console))
  global.web3 = new Web3(providerStream)
}

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

function setupApp (err, accountManager) {
  if (err) {
    log.error(err.stack)
    throw err
  }

  var container = document.getElementById('app-content')

  MetaMaskUi({
    container: container,
    accountManager: accountManager,
  })
}
