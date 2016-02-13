const url = require('url')
const EventEmitter = require('events').EventEmitter
const async = require('async')
const Dnode = require('dnode')
const MetaMaskUi = require('metamask-ui')
const MetaMaskUiCss = require('metamask-ui/css')
const injectCss = require('inject-css')
const PortStream = require('./lib/port-stream.js')

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
  var duplex = new PortStream(pluginPort)
  var eventEmitter = new EventEmitter()
  var background = Dnode({
    // setUnconfirmedTxs: setUnconfirmedTxs,
    sendUpdate: function(state){
      eventEmitter.emit('update', state)
    },
  })
  duplex.pipe(background).pipe(duplex)
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