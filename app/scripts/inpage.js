/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('metamask-inpage-provider')
restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

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

// Augment the provider with its enable method
inpageProvider.enable = function () {
  return new Promise((resolve) => {
    resolve(inpageProvider.send({ method: 'eth_accounts' }).result)
  })
}

window.ethereum = inpageProvider

//
// setup web3
//

if (typeof window.web3 !== 'undefined') {
  throw new Error(`MetaMask detected another web3.
     MetaMask will not work reliably with another web3 extension.
     This usually happens if you have two MetaMasks installed,
     or MetaMask and another web3 extension. Please remove one
     and try again.`)
}
var web3 = new Web3(inpageProvider)
web3.setProvider = function () {
  log.debug('MetaMask - overrode web3.setProvider')
}
log.debug('MetaMask - injected web3')

setupDappAutoReload(web3, inpageProvider.publicConfigStore)

// export global web3, with usage-detection and deprecation warning

/* TODO: Uncomment this area once auto-reload.js has been deprecated:
let hasBeenWarned = false
global.web3 = new Proxy(web3, {
  get: (_web3, key) => {
    // show warning once on web3 access
    if (!hasBeenWarned && key !== 'currentProvider') {
      console.warn('MetaMask: web3 will be deprecated in the near future in favor of the ethereumProvider \nhttps://github.com/MetaMask/faq/blob/master/detecting_metamask.md#web3-deprecation')
      hasBeenWarned = true
    }
    // return value normally
    return _web3[key]
  },
  set: (_web3, key, value) => {
    // set value normally
    _web3[key] = value
  },
})
*/

// set web3 defaultAccount
inpageProvider.publicConfigStore.subscribe(function (state) {
  web3.eth.defaultAccount = state.selectedAddress
})

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
var __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
function cleanContextForImports () {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
function restoreContextAfterImports () {
  try {
    global.define = __define
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.')
  }
}
