// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
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
const restoreContextAfterImports = () => {
  try {
    global.define = __define
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.')
  }
}

cleanContextForImports()

const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const MetamaskInpageProvider = require('./metamask-inpage-provider.js')

// TODO:deprecate:2020-01-13
// const Conflux = require('js-conflux-sdk/dist/js-conflux-sdk.umd.min.js')
const Conflux = require('js-conflux-sdk')
const setupDappAutoReload = require('./lib/auto-reload.js')

restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
const metamaskStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})

// compose the inpage provider
const inpageProvider = new MetamaskInpageProvider(metamaskStream)

// set a high max listener count to avoid unnecesary warnings
inpageProvider.setMaxListeners(100)

// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
// `sendAsync` method on the prototype, causing `this` reference issues
const proxiedInpageProvider = new Proxy(inpageProvider, {
  // straight up lie that we deleted the property so that it doesnt
  // throw an error in strict mode
  deleteProperty: () => true,
})

//
// TODO:deprecate:2020-01-13
//

// setup web3

if (typeof window.web3 !== 'undefined') {
  throw new Error(`MetaMask detected another web3.
     MetaMask will not work reliably with another web3 extension.
     This usually happens if you have two MetaMasks installed,
     or MetaMask and another web3 extension. Please remove one
     and try again.`)
}

// TODO: shouldn't specify default things here, let user do it?
const web3 = new Conflux({ defaultGasPrice: 1000000000, defaultGas: 21000 })
web3.provider = proxiedInpageProvider
web3.setProvider = function () {
  log.debug('MetaMask - overrode web3.setProvider')
}
log.debug('MetaMask - injected web3')

proxiedInpageProvider._web3Ref = web3.eth

// setup dapp auto reload AND proxy web3
setupDappAutoReload(web3, inpageProvider._publicConfigStore)

//
// end deprecate:2020-01-13
//

window.ethereum = proxiedInpageProvider
