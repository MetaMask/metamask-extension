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
      selectedAccount: action.value,
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

  case actions.SHOW_NEW_VAULT_SEED:
    return extend(metamaskState, {
      isUnlocked: true,
      isInitialized: false,
    })

  case actions.CLEAR_SEED_WORD_CACHE:
    var newState = extend(metamaskState, {
      isUnlocked: true,
      isInitialized: true,
      selectedAccount: action.value,
    })
    delete newState.seedWords
    return newState

  case actions.SHOW_ACCOUNT_DETAIL:
    const newState = extend(metamaskState, {
      isUnlocked: true,
      isInitialized: true,
      selectedAccount: action.value,
      selectedAddress: action.value,
    })
    delete newState.seedWords
    return newState

  default:
    return metamaskState

  }
}
