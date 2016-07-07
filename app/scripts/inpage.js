/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const LocalMessageDuplexStream = require('./lib/local-message-stream.js')
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

//
// export global web3 with auto dapp reload
//

var reloadStream = inpageProvider.multiStream.createStream('reload')
setupDappAutoReload(web3, reloadStream)

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
  delete global.define
}

function restoreContextAfterImports () {
  global.define = __define
}
