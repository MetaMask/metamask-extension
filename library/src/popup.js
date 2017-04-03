const injectCss = require('inject-css')
const MetaMaskUiCss = require('../../ui/css')
const setupIframe = require('./lib/setup-iframe.js')
const MetamaskInpageProvider = require('../../app/scripts/lib/inpage-provider.js')
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')
const startPopup = require('../../app/scripts/popup-core')


var css = MetaMaskUiCss()
injectCss(css)

var name = 'popup'
window.METAMASK_UI_TYPE = name

console.log('outside:open')

const background = new SWcontroller({
  fileName: '/popup/sw-build.js',
})
background.on('ready', (readSw) => {
  let swStream = SwStream({
    serviceWorker: background.controller,
  })
  startPopup(swStream)
})

background.startWorker()
console.log('hello from /library/popup.js')
