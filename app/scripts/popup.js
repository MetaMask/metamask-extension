const EventEmitter = require('events').EventEmitter
const async = require('async')
const Dnode = require('dnode')
const Web3 = require('web3')
const MetaMaskUi = require('../../ui')
const MetaMaskUiCss = require('../../ui/css')
const injectCss = require('inject-css')
const PortStream = require('./lib/port-stream.js')
const StreamProvider = require('web3-stream-provider')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const isPopupOrNotification = require('./lib/is-popup-or-notification')
const extension = require('./lib/extension')
const notification = require('./lib/notifications')

// setup app
var css = MetaMaskUiCss()
injectCss(css)

async.parallel({
  accountManager: connectToAccountManager,
}, setupApp)

function connectToAccountManager (cb) {
  // setup communication with background

  var name = isPopupOrNotification()
  closePopupIfOpen(name)
  window.METAMASK_UI_TYPE = name
  var pluginPort = extension.runtime.connect({ name })
  var portStream = new PortStream(pluginPort)
  // setup multiplexing
  var mx = setupMultiplex(portStream)
  // connect features
  setupControllerConnection(mx.createStream('controller'), cb)
  setupWeb3Connection(mx.createStream('provider'))
}

function setupWeb3Connection (stream) {
  var remoteProvider = new StreamProvider()
  remoteProvider.pipe(stream).pipe(remoteProvider)
  stream.on('error', console.error.bind(console))
  remoteProvider.on('error', console.error.bind(console))
  global.web3 = new Web3(remoteProvider)
}

function setupControllerConnection (stream, cb) {
  // this is a really sneaky way of adding EventEmitter api 
  // to a bi-directional dnode instance
  var eventEmitter = new EventEmitter()
  var background = Dnode({
    sendUpdate: function (state) {
      eventEmitter.emit('update', state)
    },
  })
  stream.pipe(background).pipe(stream)
  background.once('remote', function (accountManager) {
    // setup push events
    accountManager.on = eventEmitter.on.bind(eventEmitter)
    cb(null, accountManager)
  })
}

function setupApp (err, opts) {
  if (err) {
    alert(err.stack)
    throw err
  }

  var container = document.getElementById('app-content')

  MetaMaskUi({
    container: container,
    accountManager: opts.accountManager,
    networkVersion: opts.networkVersion,
  })
}

function closePopupIfOpen(name) {
  if (name !== 'notification') {
    notification.closePopup()
  }
}
