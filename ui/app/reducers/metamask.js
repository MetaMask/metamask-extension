const extend = require('xtend')
const actions = require('../actions')
const MetamascaraPlatform = require('../../../app/scripts/platforms/window')
const { getEnvironmentType } = require('../../../app/scripts/lib/util')
const { ENVIRONMENT_TYPE_POPUP } = require('../../../app/scripts/lib/enums')
const { OLD_UI_NETWORK_TYPE } = require('../../../app/scripts/controllers/network/enums')

module.exports = reduceMetamask

function reduceMetamask (state, action) {
  let newState

  // clone + defaults
  var metamaskState = extend({
    isInitialized: false,
    isUnlocked: false,
    isAccountMenuOpen: false,
    isMascara: window.platform instanceof MetamascaraPlatform,
    isPopup: getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP,
    rpcTarget: 'https://rawtestrpc.metamask.io/',
    identities: {},
    unapprovedTxs: {},
    noActiveNotices: true,
    nextUnreadNotice: undefined,
    frequentRpcList: [],
    addressBook: [],
    selectedTokenAddress: null,
    contractExchangeRates: {},
    tokenExchangeRates: {},
    tokens: [],
    pendingTokens: {},
    send: {
      gasLimit: null,
      gasPrice: null,
      gasTotal: null,
      tokenBalance: null,
      from: '',
      to: '',
      amount: '0x0',
      memo: '',
      errors: {},
      maxModeOn: false,
      editingTransactionId: null,
      forceGasMin: null,
      toNickname: '',
    },
    coinOptions: {},
    useBlockie: false,
    featureFlags: {},
    networkEndpointType: OLD_UI_NETWORK_TYPE,
    isRevealingSeedWords: false,
    welcomeScreenSeen: false,
    currentLocale: '',
  }, state.metamask)

  switch (action.type) {

    case actions.SHOW_ACCOUNTS_PAGE:
      newState = extend(metamaskState, {
        isRevealingSeedWords: false,
      })
      delete newState.seedWords
      return newState

    case actions.SHOW_NOTICE:
      return extend(metamaskState, {
        noActiveNotices: false,
        nextUnreadNotice: action.value,
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

    case actions.EDIT_TX:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          editingTransactionId: action.value,
        },
      })


    case actions.SHOW_NEW_VAULT_SEED:
      return extend(metamaskState, {
        isRevealingSeedWords: true,
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

    case actions.SET_SELECTED_TOKEN:
      return extend(metamaskState, {
        selectedTokenAddress: action.value,
      })

    case actions.SET_ACCOUNT_LABEL:
      const account = action.value.account
      const name = action.value.label
      const id = {}
      id[account] = extend(metamaskState.identities[account], { name })
      const identities = extend(metamaskState.identities, id)
      return extend(metamaskState, { identities })

    case actions.SET_CURRENT_FIAT:
      return extend(metamaskState, {
        currentCurrency: action.value.currentCurrency,
        conversionRate: action.value.conversionRate,
        conversionDate: action.value.conversionDate,
      })

    case actions.UPDATE_TOKENS:
      return extend(metamaskState, {
        tokens: action.newTokens,
      })

    // metamask.send
    case actions.UPDATE_GAS_LIMIT:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          gasLimit: action.value,
        },
      })

    case actions.UPDATE_GAS_PRICE:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          gasPrice: action.value,
        },
      })

    case actions.TOGGLE_ACCOUNT_MENU:
      return extend(metamaskState, {
        isAccountMenuOpen: !metamaskState.isAccountMenuOpen,
      })

    case actions.UPDATE_GAS_TOTAL:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          gasTotal: action.value,
        },
      })

    case actions.UPDATE_SEND_TOKEN_BALANCE:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          tokenBalance: action.value,
        },
      })

    case actions.UPDATE_SEND_HEX_DATA:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          data: action.value,
        },
      })

    case actions.UPDATE_SEND_FROM:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          from: action.value,
        },
      })

    case actions.UPDATE_SEND_TO:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          to: action.value.to,
          toNickname: action.value.nickname,
        },
      })

    case actions.UPDATE_SEND_AMOUNT:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          amount: action.value,
        },
      })

    case actions.UPDATE_SEND_MEMO:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          memo: action.value,
        },
      })

    case actions.UPDATE_MAX_MODE:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          maxModeOn: action.value,
        },
      })

    case actions.UPDATE_SEND:
      return extend(metamaskState, {
        send: {
          ...metamaskState.send,
          ...action.value,
        },
      })

    case actions.CLEAR_SEND:
      return extend(metamaskState, {
        send: {
          gasLimit: null,
          gasPrice: null,
          gasTotal: null,
          tokenBalance: null,
          from: '',
          to: '',
          amount: '0x0',
          memo: '',
          errors: {},
          editingTransactionId: null,
          forceGasMin: null,
        },
      })

    case actions.UPDATE_TRANSACTION_PARAMS:
      const { id: txId, value } = action
      let { selectedAddressTxList } = metamaskState
      selectedAddressTxList = selectedAddressTxList.map(tx => {
        if (tx.id === txId) {
          tx.txParams = value
        }
        return tx
      })

      return extend(metamaskState, {
        selectedAddressTxList,
      })

    case actions.PAIR_UPDATE:
      const { value: { marketinfo: pairMarketInfo } } = action
      return extend(metamaskState, {
        tokenExchangeRates: {
          ...metamaskState.tokenExchangeRates,
          [pairMarketInfo.pair]: pairMarketInfo,
        },
      })

    case actions.SHAPESHIFT_SUBVIEW:
      const { value: { marketinfo: ssMarketInfo, coinOptions } } = action
      return extend(metamaskState, {
        tokenExchangeRates: {
          ...metamaskState.tokenExchangeRates,
          [ssMarketInfo.pair]: ssMarketInfo,
        },
        coinOptions,
      })

    case actions.SET_USE_BLOCKIE:
          return extend(metamaskState, {
            useBlockie: action.value,
          })

    case actions.UPDATE_FEATURE_FLAGS:
      return extend(metamaskState, {
        featureFlags: action.value,
      })

    case actions.UPDATE_NETWORK_ENDPOINT_TYPE:
      return extend(metamaskState, {
        networkEndpointType: action.value,
      })

    case actions.CLOSE_WELCOME_SCREEN:
      return extend(metamaskState, {
        welcomeScreenSeen: true,
      })

    case actions.SET_CURRENT_LOCALE:
      return extend(metamaskState, {
        currentLocale: action.value,
      })

    case actions.SET_PENDING_TOKENS:
      return extend(metamaskState, {
        pendingTokens: { ...action.payload },
      })

    case actions.CLEAR_PENDING_TOKENS: {
      return extend(metamaskState, {
        pendingTokens: {},
      })
    }

    default:
      return metamaskState

  }
}
