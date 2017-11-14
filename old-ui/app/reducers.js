const extend = require('xtend')
const copyToClipboard = require('copy-to-clipboard')

//
// Sub-Reducers take in the complete state and return their sub-state
//
const reduceIdentities = require('./reducers/identities')
const reduceMetamask = require('./reducers/metamask')
const reduceApp = require('./reducers/app')

window.METAMASK_CACHED_LOG_STATE = null

module.exports = rootReducer

function rootReducer (state, action) {
  // clone
  state = extend(state)

  if (action.type === 'GLOBAL_FORCE_UPDATE') {
    return action.value
  }

  //
  // Identities
  //

  state.identities = reduceIdentities(state, action)

  //
  // MetaMask
  //

  state.metamask = reduceMetamask(state, action)

  //
  // AppState
  //

  state.appState = reduceApp(state, action)

  window.METAMASK_CACHED_LOG_STATE = state
  return state
}

window.logStateString = function (cb) {
  const state = window.METAMASK_CACHED_LOG_STATE
  const version = global.platform.getVersion()
  const browser = window.navigator.userAgent
  return global.platform.getPlatformInfo((err, platform) => {
    if (err) {
      return cb(err)
    }
    state.version = version
    state.platform = platform
    state.browser = browser
    const stateString = JSON.stringify(state, removeSeedWords, 2)
    return cb(null, stateString)
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

function removeSeedWords (key, value) {
  return key === 'seedWords' ? undefined : value
}
