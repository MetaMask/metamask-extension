const extend = require('xtend')

//
// Sub-Reducers take in the complete state and return their sub-state
//
const reduceIdentities = require('./reducers/identities')
const reduceMetamask = require('./reducers/metamask')
const reduceApp = require('./reducers/app')

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

  return state
}
