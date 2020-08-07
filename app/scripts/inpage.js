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

/* eslint-disable import/first */
import log from 'loglevel'
import LocalMessageDuplexStream from 'post-message-stream'
import { initProvider } from '@metamask/inpage-provider'

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

initProvider({
  connectionStream: metamaskStream,
})

// If there's no existing window.web3, we inject a web3 "shim" to not break
// dapps that rely on window.web3.currentProvider.
if (!window.web3) {
  const SHIM_IDENTIFIER = '__isMetaMaskShim__'
  const web3Shim = new Proxy(
    {
      currentProvider: window.ethereum,
      __isMetaMaskShim__: true,
    },
    {
      get: (target, property, ...args) => {
        if (property === 'currentProvider') {
          console.warn(
            'You are accessing the MetaMask window.web3 shim. Just use window.ethereum instead. For details, see: https://docs.metamask.io/guide/ethereum-provider.html',
          )
        } else if (property !== SHIM_IDENTIFIER) {
          console.error(
            `You are accessing the MetaMask window.web3 shim. The property '${property}' does not exist. For details, see: https://docs.metamask.io/guide/ethereum-provider.html`,
          )
        }
        return Reflect.get(target, property, ...args)
      },
    },
  )

  Object.defineProperty(window, 'web3', {
    value: Object.freeze(web3Shim),
    enumerable: false,
    configurable: true,
    writable: true,
  })
}
