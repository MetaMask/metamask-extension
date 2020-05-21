/* global Web3 */

// TODO:deprecate:2020

import log from 'loglevel'
import 'web3/dist/web3.min.js'

/**
 * Inject window.web3 and set up auto reload on chain/network change.
 */
export default function setupWeb3 () {

  if (typeof window.web3 !== 'undefined') {
    throw new Error(`MetaMask detected another web3.
      MetaMask will not work reliably with another web3 extension.
      This usually happens if you have two MetaMasks installed,
      or MetaMask and another web3 extension. Please remove one
      and try again.`)
  }

  const web3 = new Web3(window.ethereum)
  web3.setProvider = function () {
    log.debug('MetaMask - overrode web3.setProvider')
  }
  log.debug('MetaMask - injected web3')

  window.ethereum._web3Ref = web3.eth

  // export web3 as a global, checking for usage
  let reloadInProgress = false
  let lastTimeUsed
  let previousChainId
  let hasBeenWarned = false

  const web3Proxy = new Proxy(web3, {
    get: (_web3, key) => {
      // get the time of use
      lastTimeUsed = Date.now()
      // show warning once on web3 access
      if (!hasBeenWarned && key !== 'currentProvider') {
        console.warn(`MetaMask: We will soon stop injecting web3. For more information, see: https://medium.com/metamask/no-longer-injecting-web3-js-4a899ad6e59e`)
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

  Object.defineProperty(window, 'web3', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: web3Proxy,
  })

  window.ethereum.on('chainChanged', (currentChainId) => {
    // if the auto refresh on network change is false do not
    // do anything
    if (!window.ethereum.autoRefreshOnNetworkChange) {
      return
    }

    // if reload in progress, no need to check reload logic
    if (reloadInProgress) {
      return
    }

    // set the initial chain
    if (!previousChainId) {
      previousChainId = currentChainId
      return
    }

    // skip reload logic if web3 not used
    if (!lastTimeUsed) {
      return
    }

    // if chain did not change, exit
    if (currentChainId === previousChainId) {
      return
    }

    // initiate page reload
    reloadInProgress = true
    const timeSinceUse = Date.now() - lastTimeUsed
    // if web3 was recently used then delay the reloading of the page
    if (timeSinceUse > 500) {
      window.location.reload()
    } else {
      setTimeout(window.location.reload, 500)
    }
  })
}
