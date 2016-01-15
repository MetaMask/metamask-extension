const Dnode = require('dnode')
const MetaMaskUi = require('metamask-ui')
const MetaMaskUiCss = require('metamask-ui/css')
const injectCss = require('inject-css')
const PortStream = require('./lib/port-stream.js')


// setup communication with background
var pluginPort = chrome.runtime.connect({name: 'popup'})
var duplex = new PortStream(pluginPort)
var background = Dnode({
  // setUnconfirmedTxs: setUnconfirmedTxs,
})
duplex.pipe(background).pipe(duplex)
background.once('remote', setupApp)

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