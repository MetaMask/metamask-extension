import { actionConstants as actions } from '../../store/actions'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'

export default function reduceMetamask (state = {}, action) {
  const metamaskState = Object.assign({
    isInitialized: false,
    isUnlocked: false,
    isAccountMenuOpen: false,
    isPopup: getEnvironmentType() === ENVIRONMENT_TYPE_POPUP,
    rpcTarget: 'https://rawtestrpc.metamask.io/',
    identities: {},
    unapprovedTxs: {},
    frequentRpcList: [],
    addressBook: [],
    selectedTokenAddress: null,
    contractExchangeRates: {},
    tokenExchangeRates: {},
    tokens: [],
    pendingTokens: {},
    customNonceValue: '',
    send: {
      gasLimit: null,
      gasPrice: null,
      gasTotal: null,
      tokenBalance: '0x0',
      from: '',
      to: '',
      amount: '0',
      memo: '',
      errors: {},
      maxModeOn: false,
      editingTransactionId: null,
      forceGasMin: null,
      toNickname: '',
      ensResolution: null,
      ensResolutionError: '',
    },
    coinOptions: {},
    useBlockie: false,
    featureFlags: {},
    networkEndpointType: undefined,
    welcomeScreenSeen: false,
    currentLocale: '',
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
      showFiatInTestnets: false,
    },
    firstTimeFlowType: null,
    completedOnboarding: false,
    knownMethodData: {},
    participateInMetaMetrics: null,
    metaMetricsSendCount: 0,
    nextNonce: null,
  }, state)

  switch (action.type) {

    case actions.UPDATE_METAMASK_STATE:
      return { ...metamaskState, ...action.value }

    case actions.UNLOCK_METAMASK:
      return {
        ...metamaskState,
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      }

    case actions.LOCK_METAMASK:
      return {
        ...metamaskState,
        isUnlocked: false,
      }

    case actions.SET_RPC_TARGET:
      return {
        ...metamaskState,
        provider: {
          type: 'rpc',
          rpcTarget: action.value,
        },
      }

    case actions.SET_PROVIDER_TYPE:
      return {
        ...metamaskState,
        provider: {
          type: action.value,
        },
      }

    case actions.SHOW_ACCOUNT_DETAIL:
      return {
        ...metamaskState,
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      }

    case actions.SET_SELECTED_TOKEN: {
      const newState = {
        ...metamaskState,
        selectedTokenAddress: action.value,
      }
      const newSend = { ...metamaskState.send }

      if (metamaskState.send.editingTransactionId && !action.value) {
        delete newSend.token
        const unapprovedTx = newState.unapprovedTxs[newSend.editingTransactionId] || {}
        const txParams = unapprovedTx.txParams || {}
        newState.unapprovedTxs = {
          ...newState.unapprovedTxs,
          [newSend.editingTransactionId]: {
            ...unapprovedTx,
            txParams: { ...txParams, data: '' },
          },
        }
        newSend.tokenBalance = null
        newSend.balance = '0'
      }

      newState.send = newSend
      return newState
    }

    case actions.SET_ACCOUNT_LABEL:
      const account = action.value.account
      const name = action.value.label
      const id = {}
      id[account] = Object.assign({}, metamaskState.identities[account], { name })
      const identities = Object.assign({}, metamaskState.identities, id)
      return Object.assign(metamaskState, { identities })

    case actions.SET_CURRENT_FIAT:
      return Object.assign(metamaskState, {
        currentCurrency: action.value.currentCurrency,
        conversionRate: action.value.conversionRate,
        conversionDate: action.value.conversionDate,
      })

    case actions.UPDATE_TOKENS:
      return {
        ...metamaskState,
        tokens: action.newTokens,
      }

    // metamask.send
    case actions.UPDATE_GAS_LIMIT:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          gasLimit: action.value,
        },
      }
    case actions.UPDATE_CUSTOM_NONCE:
      return {
        ...metamaskState,
        customNonceValue: action.value,
      }
    case actions.UPDATE_GAS_PRICE:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          gasPrice: action.value,
        },
      }

    case actions.TOGGLE_ACCOUNT_MENU:
      return {
        ...metamaskState,
        isAccountMenuOpen: !metamaskState.isAccountMenuOpen,
      }

    case actions.UPDATE_GAS_TOTAL:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          gasTotal: action.value,
        },
      }

    case actions.UPDATE_SEND_TOKEN_BALANCE:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          tokenBalance: action.value,
        },
      }

    case actions.UPDATE_SEND_HEX_DATA:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          data: action.value,
        },
      }

    case actions.UPDATE_SEND_TO:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          to: action.value.to,
          toNickname: action.value.nickname,
        },
      }

    case actions.UPDATE_SEND_AMOUNT:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          amount: action.value,
        },
      }

    case actions.UPDATE_MAX_MODE:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          maxModeOn: action.value,
        },
      }

    case actions.UPDATE_SEND:
      return Object.assign(metamaskState, {
        send: {
          ...metamaskState.send,
          ...action.value,
        },
      })

    case actions.UPDATE_SEND_ENS_RESOLUTION:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          ensResolution: action.payload,
          ensResolutionError: '',
        },
      }

    case actions.UPDATE_SEND_ENS_RESOLUTION_ERROR:
      return {
        ...metamaskState,
        send: {
          ...metamaskState.send,
          ensResolution: null,
          ensResolutionError: action.payload,
        },
      }

    case actions.CLEAR_SEND:
      return {
        ...metamaskState,
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
      }

    case actions.UPDATE_TRANSACTION_PARAMS:
      const { id: txId, value } = action
      let { selectedAddressTxList } = metamaskState
      selectedAddressTxList = selectedAddressTxList.map((tx) => {
        if (tx.id === txId) {
          const newTx = Object.assign({}, tx)
          newTx.txParams = value
          return newTx
        }
        return tx
      })

      return {
        ...metamaskState,
        selectedAddressTxList,
      }

    case actions.PAIR_UPDATE:
      const { value: { marketinfo: pairMarketInfo } } = action
      return {
        ...metamaskState,
        tokenExchangeRates: {
          ...metamaskState.tokenExchangeRates,
          [pairMarketInfo.pair]: pairMarketInfo,
        },
      }

    case actions.SET_PARTICIPATE_IN_METAMETRICS:
      return {
        ...metamaskState,
        participateInMetaMetrics: action.value,
      }

    case actions.SET_METAMETRICS_SEND_COUNT:
      return {
        ...metamaskState,
        metaMetricsSendCount: action.value,
      }

    case actions.SET_USE_BLOCKIE:
      return {
        ...metamaskState,
        useBlockie: action.value,
      }

    case actions.UPDATE_FEATURE_FLAGS:
      return {
        ...metamaskState,
        featureFlags: action.value,
      }

    case actions.CLOSE_WELCOME_SCREEN:
      return {
        ...metamaskState,
        welcomeScreenSeen: true,
      }

    case actions.SET_CURRENT_LOCALE:
      return {
        ...metamaskState,
        currentLocale: action.value.locale,
      }

    case actions.SET_PENDING_TOKENS:
      return {
        ...metamaskState,
        pendingTokens: { ...action.payload },
      }

    case actions.CLEAR_PENDING_TOKENS: {
      return {
        ...metamaskState,
        pendingTokens: {},
      }
    }

    case actions.UPDATE_PREFERENCES: {
      return {
        ...metamaskState,
        preferences: {
          ...metamaskState.preferences,
          ...action.payload,
        },
      }
    }

    case actions.COMPLETE_ONBOARDING: {
      return {
        ...metamaskState,
        completedOnboarding: true,
      }
    }

    case actions.SET_FIRST_TIME_FLOW_TYPE: {
      return {
        ...metamaskState,
        firstTimeFlowType: action.value,
      }
    }

    case actions.SET_NEXT_NONCE: {
      return {
        ...metamaskState,
        nextNonce: action.value,
      }
    }

    default:
      return metamaskState
  }
}
