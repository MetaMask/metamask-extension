const url = require('url')
const EventEmitter = require('events').EventEmitter
const async = require('async')
const Multiplex = require('multiplex')
const Dnode = require('dnode')
const Web3 = require('web3')
const MetaMaskUi = require('metamask-ui')
const MetaMaskUiCss = require('metamask-ui/css')
const injectCss = require('inject-css')
const PortStream = require('./lib/port-stream.js')
const StreamProvider = require('./lib/stream-provider.js')
const jsonParseStream = require('./lib/stream-utils.js').jsonParseStream
const jsonStringifyStream = require('./lib/stream-utils.js').jsonStringifyStream

// setup app
var css = MetaMaskUiCss()
injectCss(css)

async.parallel({
  currentDomain: getCurrentDomain,
  accountManager: connectToAccountManager,
}, setupApp)

function connectToAccountManager(cb){
  // setup communication with background
  var pluginPort = chrome.runtime.connect({name: 'popup'})
  var portStream = new PortStream(pluginPort)
  // setup multiplexing
  var mx = Multiplex()
  portStream.pipe(mx).pipe(portStream)
  mx.on('error', function(err) {
    console.error(err)
    portStream.destroy()
  })
  portStream.on('error', function(err) {
    console.error(err)
    mx.destroy()
  })
  var dnodeStream = mx.createSharedStream('dnode')
  var providerStream = mx.createSharedStream('provider')
  linkDnode(dnodeStream, cb)
  linkWeb3(providerStream)
}

function linkWeb3(stream){
  var remoteProvider = new StreamProvider()
  remoteProvider
  .pipe(jsonStringifyStream())
  .pipe(stream)
  .pipe(jsonParseStream())
  .pipe(remoteProvider)
  stream.on('error', console.error.bind(console))
  remoteProvider.on('error', console.error.bind(console))
  global.web3 = new Web3(remoteProvider)
}

function linkDnode(stream, cb){
  var eventEmitter = new EventEmitter()
  var background = Dnode({
    sendUpdate: function(state){
      eventEmitter.emit('update', state)
    },
  })
  stream.pipe(background).pipe(stream)
  background.once('remote', function(accountManager){
    // setup push events
    accountManager.on = eventEmitter.on.bind(eventEmitter)
    cb(null, accountManager)
  })  
}

function getCurrentDomain(cb){
  chrome.tabs.query({active: true, currentWindow: true}, function(results){
    var activeTab = results[0]
    var currentUrl = activeTab && activeTab.url
    var currentDomain = url.parse(currentUrl).host
    if (!currentUrl) {
      return cb(null, '<unknown>')
    }
    cb(null, currentDomain)
  })
}

function setupApp(err, opts){
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
  })

}