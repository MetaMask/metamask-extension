/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const LocalMessageDuplexStream = require('post-message-stream')
const PingStream = require('ping-pong-stream/ping')
const endOfStream = require('end-of-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('./lib/inpage-provider.js')
restoreContextAfterImports()


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

//
// setup web3
//

var web3 = new Web3(inpageProvider)
web3.setProvider = function () {
  console.log('MetaMask - overrode web3.setProvider')
}
console.log('MetaMask - injected web3')
// export global web3, with usage-detection reload fn
var triggerReload = setupDappAutoReload(web3)

// listen for reset requests from metamask
var reloadStream = inpageProvider.multiStream.createStream('reload')
reloadStream.once('data', triggerReload)

// setup ping timeout autoreload
// LocalMessageDuplexStream does not self-close, so reload if pingStream fails
var pingChannel = inpageProvider.multiStream.createStream('pingpong')
var pingStream = new PingStream({ objectMode: true })
// wait for first successful reponse
metamaskStream.once('data', function(){
  pingStream.pipe(pingChannel).pipe(pingStream)
})
endOfStream(pingStream, triggerReload)

// set web3 defaultAcount
inpageProvider.publicConfigStore.subscribe(function (state) {
  web3.eth.defaultAccount = state.selectedAddress
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
