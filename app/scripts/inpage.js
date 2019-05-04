/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('metamask-inpage-provider')
const createStandardProvider = require('./createStandardProvider').default

let isEnabled = false
let warned = false
let providerHandle
let isApprovedHandle
let isUnlockedHandle

restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

/**
 * Adds a postMessage listener for a specific message type
 *
 * @param {string} messageType - postMessage type to listen for
 * @param {Function} handler - event handler
 * @param {boolean} remove - removes this handler after being triggered
 */
function onMessage (messageType, callback, remove) {
  const handler = function ({ data }) {
    if (!data || data.type !== messageType) { return }
    remove && window.removeEventListener('message', handler)
    callback.apply(window, arguments)
  }
  window.addEventListener('message', handler)
}

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

// set up a listener for when MetaMask is locked
onMessage('metamasksetlocked', () => { isEnabled = false })

// set up a listener for privacy mode responses
onMessage('ethereumproviderlegacy', ({ data: { selectedAddress } }) => {
  isEnabled = true
  setTimeout(() => {
    inpageProvider.publicConfigStore.updateState({ selectedAddress })
  }, 0)
}, true)

// augment the provider with its enable method
inpageProvider.enable = function ({ force } = {}) {
  return new Promise((resolve, reject) => {
    providerHandle = ({ data: { error, selectedAddress } }) => {
      if (typeof error !== 'undefined') {
        reject({
          message: error,
          code: 4001,
        })
      } else {
        window.removeEventListener('message', providerHandle)
        setTimeout(() => {
          inpageProvider.publicConfigStore.updateState({ selectedAddress })
        }, 0)

        // wait for the background to update with an account
        inpageProvider.sendAsync({ method: 'eth_accounts', params: [] }, (error, response) => {
          if (error) {
            reject(error)
          } else {
            isEnabled = true
            resolve(response.result)
          }
        })
      }
    }
    onMessage('ethereumprovider', providerHandle, true)
    window.postMessage({ type: 'ETHEREUM_ENABLE_PROVIDER', force }, '*')
  })
}

// give the dapps control of a refresh they can toggle this off on the window.ethereum
// this will be default true so it does not break any old apps.
inpageProvider.autoRefreshOnNetworkChange = true

// add metamask-specific convenience methods
inpageProvider._metamask = new Proxy({
  /**
   * Determines if this domain is currently enabled
   *
   * @returns {boolean} - true if this domain is currently enabled
   */
  isEnabled: function () {
    return isEnabled
  },

  /**
   * Determines if this domain has been previously approved
   *
   * @returns {Promise<boolean>} - Promise resolving to true if this domain has been previously approved
   */
  isApproved: function () {
    return new Promise((resolve) => {
      isApprovedHandle = ({ data: { caching, isApproved } }) => {
        if (caching) {
          resolve(!!isApproved)
        } else {
          resolve(false)
        }
      }
      onMessage('ethereumisapproved', isApprovedHandle, true)
      window.postMessage({ type: 'ETHEREUM_IS_APPROVED' }, '*')
    })
  },

  /**
   * Determines if MetaMask is unlocked by the user
   *
   * @returns {Promise<boolean>} - Promise resolving to true if MetaMask is currently unlocked
   */
  isUnlocked: function () {
    return new Promise((resolve) => {
      isUnlockedHandle = ({ data: { isUnlocked } }) => {
        resolve(!!isUnlocked)
      }
      onMessage('metamaskisunlocked', isUnlockedHandle, true)
      window.postMessage({ type: 'METAMASK_IS_UNLOCKED' }, '*')
    })
  },
}, {
  get: function (obj, prop) {
    !warned && console.warn('Heads up! ethereum._metamask exposes methods that have ' +
    'not been standardized yet. This means that these methods may not be implemented ' +
    'in other dapp browsers and may be removed from MetaMask in the future.')
    warned = true
    return obj[prop]
  },
})

// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
// `sendAsync` method on the prototype, causing `this` reference issues with drizzle
const proxiedInpageProvider = new Proxy(inpageProvider, {
  // straight up lie that we deleted the property so that it doesnt
  // throw an error in strict mode
  deleteProperty: () => true,
})

window.ethereum = createStandardProvider(proxiedInpageProvider)

// detect eth_requestAccounts and pipe to enable for now
function detectAccountRequest (method) {
  const originalMethod = inpageProvider[method]
  inpageProvider[method] = function ({ method }) {
    if (method === 'eth_requestAccounts') {
      return window.ethereum.enable()
    }
    return originalMethod.apply(this, arguments)
  }
}
detectAccountRequest('send')
detectAccountRequest('sendAsync')

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

const web3 = new Web3(proxiedInpageProvider)
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

inpageProvider.publicConfigStore.subscribe(function (state) {
  if (state.onboardingcomplete) {
    window.postMessage('onboardingcomplete', '*')
  }
})

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define

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
