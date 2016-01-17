const EventEmitter = require('events').EventEmitter
const Dnode = require('dnode')
const MetaMaskUi = require('metamask-ui')
const MetaMaskUiCss = require('metamask-ui/css')
const injectCss = require('inject-css')
const PortStream = require('./lib/port-stream.js')


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
  accountManager.on = eventEmitter.on.bind(eventEmitter)
  setupApp(accountManager)
})

// setup app
var css = MetaMaskUiCss()
injectCss(css)

function setupApp(accountManager){

  var container = document.getElementById('app-content')

  var app = MetaMaskUi({
    container: container,
    accountManager: accountManager,
  })

}