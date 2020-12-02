/*global Web3*/

// TODO:deprecate:2020
// Delete this file

import web3Entitites from './web3-entities.json'
import 'web3/dist/web3.min'

const shouldLogUsage = ![
  'docs.metamask.io',
  'metamask.github.io',
  'metamask.io',
].includes(window.location.hostname)

/**
 * To understand how we arrived at this implementation, please see:
 * https://github.com/ethereum/web3.js/blob/0.20.7/DOCUMENTATION.md
 */
export default function setupWeb3(log) {
  // export web3 as a global, checking for usage
  let reloadInProgress = false
  let lastTimeUsed
  let lastSeenNetwork
  let hasBeenWarned = false

  const web3 = new Web3(window.ethereum)
  web3.setProvider = function () {
    log.debug('MetaMask - overrode web3.setProvider')
  }
  Object.defineProperty(web3, '__isMetaMaskShim__', {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  })

  Object.defineProperty(window.ethereum, '_web3Ref', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: web3.eth,
  })

  // Setup logging of nested property usage
  if (shouldLogUsage) {
    // web3 namespaces with common and uncommon dapp actions
    const includedTopKeys = [
      'eth',
      'db',
      'shh',
      'net',
      'personal',
      'bzz',
      'version',
    ]

    // For each top-level property, create appropriate Proxy traps for all of
    // their properties
    includedTopKeys.forEach((topKey) => {
      const applyTrapKeys = new Map()
      const getTrapKeys = new Map()

      Object.keys(web3[topKey]).forEach((key) => {
        const path = `web3.${topKey}.${key}`

        if (web3Entitites[path]) {
          if (web3Entitites[path] === 'function') {
            applyTrapKeys.set(key, path)
          } else {
            getTrapKeys.set(key, path)
          }
        }
      })

      // Create apply traps for function properties
      for (const [key, path] of applyTrapKeys) {
        web3[topKey][key] = new Proxy(web3[topKey][key], {
          apply: (...params) => {
            try {
              window.ethereum.request({
                method: 'metamask_logInjectedWeb3Usage',
                params: [
                  {
                    action: 'apply',
                    path,
                  },
                ],
              })
            } catch (error) {
              log.debug('Failed to log web3 usage.', error)
            }

            // Call function normally
            return Reflect.apply(...params)
          },
        })
      }

      // Create get trap for non-function properties
      web3[topKey] = new Proxy(web3[topKey], {
        get: (web3Prop, key, ...params) => {
          const name = stringifyKey(key)

          if (getTrapKeys.has(name)) {
            try {
              window.ethereum.request({
                method: 'metamask_logInjectedWeb3Usage',
                params: [
                  {
                    action: 'get',
                    path: getTrapKeys.get(name),
                  },
                ],
              })
            } catch (error) {
              log.debug('Failed to log web3 usage.', error)
            }
          }

          // return value normally
          return Reflect.get(web3Prop, key, ...params)
        },
      })
    })

    const topLevelFunctions = [
      'isConnected',
      'setProvider',
      'reset',
      'sha3',
      'toHex',
      'toAscii',
      'fromAscii',
      'toDecimal',
      'fromDecimal',
      'fromWei',
      'toWei',
      'toBigNumber',
      'isAddress',
    ]

    // apply-trap top-level functions
    topLevelFunctions.forEach((key) => {
      // This type check is probably redundant, but we've been burned before.
      if (typeof web3[key] === 'function') {
        web3[key] = new Proxy(web3[key], {
          apply: (...params) => {
            try {
              window.ethereum.request({
                method: 'metamask_logInjectedWeb3Usage',
                params: [
                  {
                    action: 'apply',
                    path: `web3.${key}`,
                  },
                ],
              })
            } catch (error) {
              log.debug('Failed to log web3 usage.', error)
            }

            // Call function normally
            return Reflect.apply(...params)
          },
        })
      }
    })
  }

  const web3Proxy = new Proxy(web3, {
    get: (...params) => {
      // get the time of use
      lastTimeUsed = Date.now()

      // show warning once on web3 access
      if (!hasBeenWarned) {
        console.warn(
          `MetaMask: We will stop injecting web3 in Q4 2020.\nPlease see this article for more information: https://medium.com/metamask/no-longer-injecting-web3-js-4a899ad6e59e`,
        )
        hasBeenWarned = true
      }

      // return value normally
      return Reflect.get(...params)
    },
  })

  Object.defineProperty(window, 'web3', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: web3Proxy,
  })
  log.debug('MetaMask - injected web3')

  window.ethereum._publicConfigStore.subscribe((state) => {
    // if the auto refresh on network change is false do not
    // do anything
    if (!window.ethereum.autoRefreshOnNetworkChange) {
      return
    }

    // if reload in progress, no need to check reload logic
    if (reloadInProgress) {
      return
    }

    const currentNetwork = state.networkVersion

    // set the initial network
    if (!lastSeenNetwork) {
      lastSeenNetwork = currentNetwork
      return
    }

    // skip reload logic if web3 not used
    if (!lastTimeUsed) {
      return
    }

    // if network did not change, exit
    if (currentNetwork === lastSeenNetwork) {
      return
    }

    // initiate page reload
    reloadInProgress = true
    const timeSinceUse = Date.now() - lastTimeUsed
    // if web3 was recently used then delay the reloading of the page
    if (timeSinceUse > 500) {
      triggerReset()
    } else {
      setTimeout(triggerReset, 500)
    }
  })
}

// reload the page
function triggerReset() {
  window.location.reload()
}

/**
 * Returns a "stringified" key. Keys that are already strings are returned
 * unchanged, and any non-string values are returned as "typeof <type>".
 *
 * @param {any} key - The key to stringify
 */
function stringifyKey(key) {
  return typeof key === 'string' ? key : `typeof ${typeof key}`
}
