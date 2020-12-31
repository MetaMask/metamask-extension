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
    console.warn('ConfluxPortal - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define
  } catch (_) {
    console.warn('ConfluxPortal - global.define could not be overwritten.')
  }
}

cleanContextForImports()

import log from 'loglevel'
import LocalMessageDuplexStream from 'post-message-stream'
import ConfluxPortalInpageProvider from '@yqrashawn/conflux-portal-inpage-provider'
import * as ConfluxJSSDK from 'js-conflux-sdk'
import setupDappAutoReload from './lib/auto-reload.js'

const { Conflux: ConfluxJS } = ConfluxJSSDK

restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
const metamaskStream = new LocalMessageDuplexStream({
  name: 'portal-inpage',
  target: 'portal-contentscript',
})

// compose the inpage provider
const inpageProvider = new ConfluxPortalInpageProvider(metamaskStream)

// set a high max listener count to avoid unnecesary warnings
inpageProvider.setMaxListeners(100)

// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
// `sendAsync` method on the prototype, causing `this` reference issues
const proxiedInpageProvider = new Proxy(inpageProvider, {
  // straight up lie that we deleted the property so that it doesnt
  // throw an error in strict mode
  deleteProperty: () => true,
})

// setup conflux web

if (typeof window.confluxJS !== 'undefined') {
  throw new Error(`ConfluxPortal detected another js-conflux-sdk.
     ConfluxPortal will not work reliably with another js-conflux-sdk extension.
     This usually happens if you have two MetaMasks installed,
     or ConfluxPortal and another conflux web extension. Please remove one
     and try again.`)
}

const confluxJS = new ConfluxJS()
confluxJS.provider = proxiedInpageProvider
confluxJS.setProvider = function() {
  log.debug('ConfluxPortal - overrode conflux.setProvider')
}
log.debug('ConfluxPortal - injected conflux')

proxiedInpageProvider._web3Ref = confluxJS

// setup dapp auto reload AND proxy web3
setupDappAutoReload(confluxJS, inpageProvider._publicConfigStore)

window.conflux = proxiedInpageProvider
window.ConfluxJSSDK = ConfluxJSSDK
