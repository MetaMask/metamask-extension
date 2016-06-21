const url = require('url')
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

// setup app
var css = MetaMaskUiCss()
injectCss(css)

async.parallel({
  currentDomain: getCurrentDomain,
  accountManager: connectToAccountManager,
}, setupApp)

function connectToAccountManager (cb) {
  // setup communication with background
  var pluginPort = chrome.runtime.connect({name: 'popup'})
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

function getCurrentDomain (cb) {
  chrome.tabs.query({active: true, currentWindow: true}, function (results) {
    var activeTab = results[0]
    var currentUrl = activeTab && activeTab.url
    var currentDomain = url.parse(currentUrl).host
    if (!currentUrl) {
      return cb(null, '<unknown>')
    }
    cb(null, currentDomain)
  })
}

function setupApp (err, opts) {
  if (err) {
    alert(err.stack)
    throw err
    return
  }

  var container = document.getElementById('app-content')

  var app = MetaMaskUi({
    container: container,
    accountManager: opts.accountManager,
    currentDomain: opts.currentDomain,
    networkVersion: opts.networkVersion,
  })
}
