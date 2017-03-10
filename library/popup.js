const injectCss = require('inject-css')
const MetaMaskUiCss = require('../ui/css')
const startPopup = require('../app/scripts/popup-core')
const setupIframe = require('./lib/setup-iframe.js')


var css = MetaMaskUiCss()
injectCss(css)

var name = 'popup'
window.METAMASK_UI_TYPE = name

var iframeStream = setupIframe({
  zeroClientProvider: 'http://localhost:9001',
  sandboxAttributes: ['allow-scripts', 'allow-popups', 'allow-same-origin'],
  container: document.body,
})

startPopup(iframeStream)
