/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const LocalMessageDuplexStream = require('post-message-stream')
// const PingStream = require('ping-pong-stream/ping')
// const endOfStream = require('end-of-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('./lib/inpage-provider.js')
const setupMascaraProxyProvider = require('./lib/mascara-proxy-provider.js')
restoreContextAfterImports()

const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
//
// setup plugin communication
//

// setup background connection
var metamaskStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})

// compose the inpage provider
var inpageProvider = new MetamaskInpageProvider(metamaskStream)
inpageProvider = setupMascaraProxyProvider(inpageProvider)
//
// setup web3
//

var web3 = new Web3(inpageProvider)
web3.setProvider = function () {
  console.log('MetaMask - overrode web3.setProvider')
}
// export global web3, with usage-detection
const origin = window.location.origin
const shouldExport = !(
  origin === 'https://zero.metamask.io' ||
  (origin === 'http://localhost:9001' && METAMASK_DEBUG)
)

if (shouldExport) {
  setupDappAutoReload(web3, inpageProvider.publicConfigStore)
  console.log('MetaMask - injected web3')
}
// set web3 defaultAccount

inpageProvider.publicConfigStore.subscribe(function (state) {
  // if not using the mascara provider
  if (!inpageProvider.isMascaraActive) web3.eth.defaultAccount = state.selectedAddress
})

//
// util
//

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
var __define

function cleanContextForImports () {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.')
  }
}

function restoreContextAfterImports () {
  try {
    global.define = __define
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.')
  }
}