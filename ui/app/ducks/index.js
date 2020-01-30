const clone = require('clone')
const extend = require('xtend')
const copyToClipboard = require('copy-to-clipboard')

//
// Sub-Reducers take in the complete state and return their sub-state
//
const reduceMetamask = require('./metamask/metamask')
const reduceLocale = require('./locale/locale')
const reduceSend = require('./send/send.duck').default
import reduceApp from './app/app'
import reduceConfirmTransaction from './confirm-transaction/confirm-transaction.duck'
import reduceGas from './gas/gas.duck'

window.METAMASK_CACHED_LOG_STATE = null

module.exports = rootReducer

function rootReducer (state, action) {
  // clone
  state = extend(state)

  if (action.type === 'GLOBAL_FORCE_UPDATE') {
    return action.value
  }

  //
  // MetaMask
  //

  state.metamask = reduceMetamask(state, action)

  //
  // AppState
  //

  state.appState = reduceApp(state, action)

  //
  // LocaleMessages
  //

  state.localeMessages = reduceLocale(state, action)

  //
  // Send
  //

  state.send = reduceSend(state, action)

  state.confirmTransaction = reduceConfirmTransaction(state, action)

  state.gas = reduceGas(state, action)

  window.METAMASK_CACHED_LOG_STATE = state
  return state
}

window.getCleanAppState = function () {
  const state = clone(window.METAMASK_CACHED_LOG_STATE)
  // append additional information
  state.version = global.platform.getVersion()
  state.browser = window.navigator.userAgent
  return state
}

window.logStateString = function (cb) {
  const state = window.getCleanAppState()
  global.platform.getPlatformInfo((err, platform) => {
    if (err) return cb(err)
    state.platform = platform
    const stateString = JSON.stringify(state, null, 2)
    cb(null, stateString)
  })
}

window.logState = function (toClipboard) {
  return window.logStateString((err, result) => {
    if (err) {
      console.error(err.message)
    } else if (toClipboard) {
      copyToClipboard(result)
      console.log('State log copied')
    } else {
      console.log(result)
    }
  })
}
