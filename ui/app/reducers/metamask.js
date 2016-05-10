const extend = require('xtend')
const actions = require('../actions')

module.exports = reduceMetamask

function reduceMetamask(state, action) {

  // clone + defaults
  var metamaskState = extend({
    isInitialized: false,
    isUnlocked: false,
    currentDomain: 'example.com',
    rpcTarget: 'https://rawtestrpc.metamask.io/',
    identities: {},
    unconfTxs: {},
  }, state.metamask)

  switch (action.type) {

  case actions.SHOW_ACCOUNTS_PAGE:
    var state = extend(metamaskState)
    delete state.seedWords
    return state

  case actions.UPDATE_METAMASK_STATE:
    return extend(metamaskState, action.value)

  case actions.UNLOCK_METAMASK:
    return extend(metamaskState, {
      isUnlocked: true,
      isInitialized: true,
    })

  case actions.LOCK_METAMASK:
    return extend(metamaskState, {
      isUnlocked: false,
    })

  case actions.SET_RPC_TARGET:
    return extend(metamaskState, {
      provider: {
        type: 'rpc',
        rpcTarget: action.value,
      },
    })

  case actions.SET_PROVIDER_TYPE:
    return extend(metamaskState, {
      provider: {
        type: action.value,
      },
    })

  case actions.COMPLETED_TX:
    var stringId = String(action.id)
    var newState = extend(metamaskState, {
      unconfTxs: {},
      unconfMsgs: {},
    })
    for (var id in metamaskState.unconfTxs) {
      if (id !== stringId) {
        newState.unconfTxs[id] = metamaskState.unconfTxs[id]
      }
    }
    for (var id in metamaskState.unconfMsgs) {
      if (id !== stringId) {
        newState.unconfMsgs[id] = metamaskState.unconfMsgs[id]
      }
    }
    return newState

  case actions.CLEAR_SEED_WORD_CACHE:
    var newState = extend(metamaskState, {
      isInitialized: true,
    })
    delete newState.seedWords
    return newState

  case actions.CREATE_NEW_VAULT_IN_PROGRESS:
    return extend(metamaskState, {
      isUnlocked: true,
      isInitialized: true,
    })

  default:
    return metamaskState

  }
}
