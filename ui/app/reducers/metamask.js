const extend = require('xtend')
const actions = require('../actions')

module.exports = reduceMetamask

function reduceMetamask (state, action) {
  let newState

  // clone + defaults
  var metamaskState = extend({
    isInitialized: false,
    isUnlocked: false,
    isEthConfirmed: false,
    currentDomain: 'example.com',
    rpcTarget: 'https://rawtestrpc.metamask.io/',
    identities: {},
    unconfTxs: {},
    currentFiat: 'USD',
    conversionRate: 0,
    conversionDate: 'N/A',
  }, state.metamask)

  switch (action.type) {

    case actions.SHOW_ACCOUNTS_PAGE:
      newState = extend(metamaskState)
      delete newState.seedWords
      return newState

    case actions.UPDATE_METAMASK_STATE:
      return extend(metamaskState, action.value)

    case actions.AGREE_TO_DISCLAIMER:
      return extend(metamaskState, {
        isConfirmed: true,
      })

    case actions.AGREE_TO_ETH_WARNING:
      return extend(metamaskState, {
        isEthConfirmed: !metamaskState.isEthConfirmed,
      })

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
      newState = extend(metamaskState, {
        unconfTxs: {},
        unconfMsgs: {},
      })
      for (const id in metamaskState.unconfTxs) {
        if (id !== stringId) {
          newState.unconfTxs[id] = metamaskState.unconfTxs[id]
        }
      }
      for (const id in metamaskState.unconfMsgs) {
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
      newState = extend(metamaskState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAccount: action.value,
      })
      delete newState.seedWords
      return newState

    case actions.SHOW_ACCOUNT_DETAIL:
      newState = extend(metamaskState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAccount: action.value,
        selectedAddress: action.value,
      })
      delete newState.seedWords
      return newState

    case actions.SAVE_ACCOUNT_LABEL:
      const account = action.value.account
      const name = action.value.label
      var id = {}
      id[account] = extend(metamaskState.identities[account], { name })
      var identities = extend(metamaskState.identities, id)
      return extend(metamaskState, { identities })

    case actions.SET_CURRENT_FIAT:
      return extend(metamaskState, {
        currentFiat: action.value.currentFiat,
        conversionRate: action.value.conversionRate,
        conversionDate: action.value.conversionDate,
      })

    default:
      return metamaskState

  }
}
