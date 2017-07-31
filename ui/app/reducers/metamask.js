const extend = require('xtend')
const actions = require('../actions')

module.exports = reduceMetamask

function reduceMetamask (state, action) {
  let newState

  // clone + defaults
  var metamaskState = extend({
    isInitialized: false,
    isUnlocked: false,
    rpcTarget: 'https://rawtestrpc.metamask.io/',
    identities: {},
    unapprovedTxs: {},
    noActiveNotices: true,
    lastUnreadNotice: undefined,
    confirmedSeed: false,
    frequentRpcList: [],
    addressBook: [],
  }, state.metamask)

  switch (action.type) {

    case actions.SHOW_ACCOUNTS_PAGE:
      newState = extend(metamaskState)
      delete newState.seedWords
      return newState

    case actions.SHOW_NOTICE:
      return extend(metamaskState, {
        noActiveNotices: false,
        lastUnreadNotice: action.value,
      })

    case actions.CLEAR_NOTICES:
      return extend(metamaskState, {
        noActiveNotices: true,
      })

    case actions.UPDATE_METAMASK_STATE:
      return extend(metamaskState, action.value)

    case actions.UNLOCK_METAMASK:
      return extend(metamaskState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      })

    case actions.LOCK_METAMASK:
      return extend(metamaskState, {
        isUnlocked: false,
      })

    case actions.SET_RPC_LIST:
      return extend(metamaskState, {
        frequentRpcList: action.value,
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
        unapprovedTxs: {},
        unapprovedMsgs: {},
      })
      for (const id in metamaskState.unapprovedTxs) {
        if (id !== stringId) {
          newState.unapprovedTxs[id] = metamaskState.unapprovedTxs[id]
        }
      }
      for (const id in metamaskState.unapprovedMsgs) {
        if (id !== stringId) {
          newState.unapprovedMsgs[id] = metamaskState.unapprovedMsgs[id]
        }
      }
      return newState

    case actions.SHOW_NEW_VAULT_SEED:
      return extend(metamaskState, {
        isUnlocked: true,
        isInitialized: false,
        seedWords: action.value,
      })

    case actions.SEED_WORD_CONFIRMATION:
      return extend(metamaskState, {
        isUnlocked: true,
        isInitialized: false,
        seedWords: action.value,
      })

    case actions.CLEAR_SEED_WORD_CACHE:
      newState = extend(metamaskState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      })
      delete newState.seedWords
      return newState

    case actions.SHOW_ACCOUNT_DETAIL:
      newState = extend(metamaskState, {
        isUnlocked: true,
        isInitialized: true,
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
        currentCurrency: action.value.currentCurrency,
        conversionRate: action.value.conversionRate,
        conversionDate: action.value.conversionDate,
      })

    default:
      return metamaskState

  }
}
