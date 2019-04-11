const extend = require('xtend')
const actions = require('../../store/actions')
const txHelper = require('../../../lib/tx-helper')
const log = require('loglevel')

module.exports = reduceApp


function reduceApp (state, action) {
  log.debug('App Reducer got ' + action.type)
  // clone and defaults
  const selectedAddress = state.metamask.selectedAddress
  const hasUnconfActions = checkUnconfActions(state)
  let name = 'accounts'
  if (selectedAddress) {
    name = 'accountDetail'
  }

  if (hasUnconfActions) {
    log.debug('pending txs detected, defaulting to conf-tx view.')
    name = 'confTx'
  }

  var defaultView = {
    name,
    detailView: null,
    context: selectedAddress,
  }

  // confirm seed words
  var seedWords = state.metamask.seedWords
  var seedConfView = {
    name: 'createVaultComplete',
    seedWords,
  }

  // default state
  var appState = extend({
    shouldClose: false,
    menuOpen: false,
    modal: {
      open: false,
      modalState: {
        name: null,
        props: {},
      },
      previousModalState: {
        name: null,
      },
    },
    sidebar: {
      isOpen: false,
      transitionName: '',
      type: '',
      props: {},
    },
    alertOpen: false,
    alertMessage: null,
    qrCodeData: null,
    networkDropdownOpen: false,
    currentView: seedWords ? seedConfView : defaultView,
    accountDetail: {
      subview: 'transactions',
    },
    // Used to render transition direction
    transForward: true,
    // Used to display loading indicator
    isLoading: false,
    // Used to display error text
    warning: null,
    buyView: {},
    isMouseUser: false,
    gasIsLoading: false,
    networkNonce: null,
    defaultHdPaths: {
      trezor: `m/44'/60'/0'/0`,
      ledger: `m/44'/60'/0'/0/0`,
    },
    lastSelectedProvider: null,
    networksTabSelectedRpcUrl: '',
  }, state.appState)

  switch (action.type) {
    // dropdown methods
    case actions.NETWORK_DROPDOWN_OPEN:
      return extend(appState, {
        networkDropdownOpen: true,
      })

    case actions.NETWORK_DROPDOWN_CLOSE:
      return extend(appState, {
        networkDropdownOpen: false,
      })

    // sidebar methods
    case actions.SIDEBAR_OPEN:
      return extend(appState, {
        sidebar: {
          ...action.value,
          isOpen: true,
        },
      })

    case actions.SIDEBAR_CLOSE:
      return extend(appState, {
        sidebar: {
          ...appState.sidebar,
          isOpen: false,
        },
      })

    // alert methods
    case actions.ALERT_OPEN:
      return extend(appState, {
        alertOpen: true,
        alertMessage: action.value,
      })

    case actions.ALERT_CLOSE:
      return extend(appState, {
        alertOpen: false,
        alertMessage: null,
      })

    // qr scanner methods
    case actions.QR_CODE_DETECTED:
      return extend(appState, {
        qrCodeData: action.value,
      })


    // modal methods:
    case actions.MODAL_OPEN:
      const { name, ...modalProps } = action.payload

      return extend(appState, {
        modal: {
          open: true,
          modalState: {
            name: name,
            props: { ...modalProps },
          },
          previousModalState: { ...appState.modal.modalState },
        },
      })

    case actions.MODAL_CLOSE:
      return extend(appState, {
        modal: Object.assign(
          state.appState.modal,
          { open: false },
          { modalState: { name: null, props: {} } },
          { previousModalState: appState.modal.modalState},
        ),
      })

    // transition methods
    case actions.TRANSITION_FORWARD:
      return extend(appState, {
        transForward: true,
      })

    case actions.TRANSITION_BACKWARD:
      return extend(appState, {
        transForward: false,
      })

    // intialize

    case actions.SHOW_CREATE_VAULT:
      return extend(appState, {
        currentView: {
          name: 'createVault',
        },
        transForward: true,
        warning: null,
      })

    case actions.SHOW_RESTORE_VAULT:
      return extend(appState, {
        currentView: {
          name: 'restoreVault',
        },
        transForward: true,
        forgottenPassword: true,
      })

    case actions.FORGOT_PASSWORD:
      const newState = extend(appState, {
        forgottenPassword: action.value,
      })

      if (action.value) {
        newState.currentView = {
          name: 'restoreVault',
        }
      }

      return newState

    case actions.SHOW_INIT_MENU:
      return extend(appState, {
        currentView: defaultView,
        transForward: false,
      })

    case actions.SHOW_CONFIG_PAGE:
      return extend(appState, {
        currentView: {
          name: 'config',
          context: appState.currentView.context,
        },
        transForward: action.value,
      })

    case actions.SHOW_ADD_TOKEN_PAGE:
      return extend(appState, {
        currentView: {
          name: 'add-token',
          context: appState.currentView.context,
        },
        transForward: action.value,
      })

    case actions.SHOW_ADD_SUGGESTED_TOKEN_PAGE:
      return extend(appState, {
        currentView: {
          name: 'add-suggested-token',
          context: appState.currentView.context,
        },
        transForward: action.value,
      })

    case actions.SHOW_IMPORT_PAGE:
      return extend(appState, {
        currentView: {
          name: 'import-menu',
        },
        transForward: true,
        warning: null,
      })

    case actions.SHOW_NEW_ACCOUNT_PAGE:
      return extend(appState, {
        currentView: {
          name: 'new-account-page',
          context: action.formToSelect,
        },
        transForward: true,
        warning: null,
      })

    case actions.SET_NEW_ACCOUNT_FORM:
      return extend(appState, {
        currentView: {
          name: appState.currentView.name,
          context: action.formToSelect,
        },
      })

    case actions.SHOW_INFO_PAGE:
      return extend(appState, {
        currentView: {
          name: 'info',
          context: appState.currentView.context,
        },
        transForward: true,
      })

  case actions.CREATE_NEW_VAULT_IN_PROGRESS:
      return extend(appState, {
        currentView: {
          name: 'createVault',
          inProgress: true,
        },
        transForward: true,
        isLoading: true,
      })

    case actions.SHOW_NEW_VAULT_SEED:
      return extend(appState, {
        currentView: {
          name: 'createVaultComplete',
          seedWords: action.value,
        },
        transForward: true,
        isLoading: false,
      })

    case actions.NEW_ACCOUNT_SCREEN:
      return extend(appState, {
        currentView: {
          name: 'new-account',
          context: appState.currentView.context,
        },
        transForward: true,
      })

    case actions.SHOW_SEND_PAGE:
      return extend(appState, {
        currentView: {
          name: 'sendTransaction',
          context: appState.currentView.context,
        },
        transForward: true,
        warning: null,
      })

    case actions.SHOW_SEND_TOKEN_PAGE:
      return extend(appState, {
        currentView: {
          name: 'sendToken',
          context: appState.currentView.context,
        },
        transForward: true,
        warning: null,
      })

    case actions.SHOW_NEW_KEYCHAIN:
      return extend(appState, {
        currentView: {
          name: 'newKeychain',
          context: appState.currentView.context,
        },
        transForward: true,
      })

  // unlock

    case actions.UNLOCK_METAMASK:
      return extend(appState, {
        forgottenPassword: appState.forgottenPassword ? !appState.forgottenPassword : null,
        detailView: {},
        transForward: true,
        isLoading: false,
        warning: null,
      })

    case actions.LOCK_METAMASK:
      return extend(appState, {
        currentView: defaultView,
        transForward: false,
        warning: null,
      })

    case actions.BACK_TO_INIT_MENU:
      return extend(appState, {
        warning: null,
        transForward: false,
        forgottenPassword: true,
        currentView: {
          name: 'InitMenu',
        },
      })

    case actions.BACK_TO_UNLOCK_VIEW:
      return extend(appState, {
        warning: null,
        transForward: true,
        forgottenPassword: false,
        currentView: {
          name: 'UnlockScreen',
        },
      })
  // reveal seed words

    case actions.REVEAL_SEED_CONFIRMATION:
      return extend(appState, {
        currentView: {
          name: 'reveal-seed-conf',
        },
        transForward: true,
        warning: null,
      })

  // accounts

    case actions.SET_SELECTED_ACCOUNT:
      return extend(appState, {
        activeAddress: action.value,
      })

    case actions.GO_HOME:
      return extend(appState, {
        currentView: extend(appState.currentView, {
          name: 'accountDetail',
        }),
        accountDetail: {
          subview: 'transactions',
          accountExport: 'none',
          privateKey: '',
        },
        transForward: false,
        warning: null,
      })

    case actions.SHOW_ACCOUNT_DETAIL:
      return extend(appState, {
        forgottenPassword: appState.forgottenPassword ? !appState.forgottenPassword : null,
        currentView: {
          name: 'accountDetail',
          context: action.value,
        },
        accountDetail: {
          subview: 'transactions',
          accountExport: 'none',
          privateKey: '',
        },
        transForward: false,
      })

    case actions.BACK_TO_ACCOUNT_DETAIL:
      return extend(appState, {
        currentView: {
          name: 'accountDetail',
          context: action.value,
        },
        accountDetail: {
          subview: 'transactions',
          accountExport: 'none',
          privateKey: '',
        },
        transForward: false,
      })

    case actions.SHOW_ACCOUNTS_PAGE:
      return extend(appState, {
        currentView: {
          name: seedWords ? 'createVaultComplete' : 'accounts',
          seedWords,
        },
        transForward: true,
        isLoading: false,
        warning: null,
        scrollToBottom: false,
        forgottenPassword: false,
      })

    case actions.REVEAL_ACCOUNT:
      return extend(appState, {
        scrollToBottom: true,
      })

    case actions.SHOW_CONF_TX_PAGE:
      return extend(appState, {
        currentView: {
          name: 'confTx',
          context: action.id ? indexForPending(state, action.id) : 0,
        },
        transForward: action.transForward,
        warning: null,
        isLoading: false,
      })

    case actions.SHOW_CONF_MSG_PAGE:
      return extend(appState, {
        currentView: {
          name: hasUnconfActions ? 'confTx' : 'account-detail',
          context: 0,
        },
        transForward: true,
        warning: null,
        isLoading: false,
      })

    case actions.COMPLETED_TX:
      log.debug('reducing COMPLETED_TX for tx ' + action.value)
      const otherUnconfActions = getUnconfActionList(state)
        .filter(tx => tx.id !== action.value)
      const hasOtherUnconfActions = otherUnconfActions.length > 0

      if (hasOtherUnconfActions) {
        log.debug('reducer detected txs - rendering confTx view')
        return extend(appState, {
          transForward: false,
          currentView: {
            name: 'confTx',
            context: 0,
          },
          warning: null,
        })
      } else {
        log.debug('attempting to close popup')
        return extend(appState, {
          // indicate notification should close
          shouldClose: true,
          transForward: false,
          warning: null,
          currentView: {
            name: 'accountDetail',
            context: state.metamask.selectedAddress,
          },
          accountDetail: {
            subview: 'transactions',
          },
        })
      }

    case actions.NEXT_TX:
      return extend(appState, {
        transForward: true,
        currentView: {
          name: 'confTx',
          context: ++appState.currentView.context,
          warning: null,
        },
      })

    case actions.VIEW_PENDING_TX:
      const context = indexForPending(state, action.value)
      return extend(appState, {
        transForward: true,
        currentView: {
          name: 'confTx',
          context,
          warning: null,
        },
      })

    case actions.PREVIOUS_TX:
      return extend(appState, {
        transForward: false,
        currentView: {
          name: 'confTx',
          context: --appState.currentView.context,
          warning: null,
        },
      })

    case actions.TRANSACTION_ERROR:
      return extend(appState, {
        currentView: {
          name: 'confTx',
          errorMessage: 'There was a problem submitting this transaction.',
        },
      })

    case actions.UNLOCK_FAILED:
      return extend(appState, {
        warning: action.value || 'Incorrect password. Try again.',
      })

    case actions.UNLOCK_SUCCEEDED:
      return extend(appState, {
        warning: '',
      })

    case actions.SET_HARDWARE_WALLET_DEFAULT_HD_PATH:
      const { device, path } = action.value
      const newDefaults = {...appState.defaultHdPaths}
      newDefaults[device] = path

      return extend(appState, {
        defaultHdPaths: newDefaults,
      })

    case actions.SHOW_LOADING:
      return extend(appState, {
        isLoading: true,
        loadingMessage: action.value,
      })

    case actions.HIDE_LOADING:
      return extend(appState, {
        isLoading: false,
      })

    case actions.SHOW_SUB_LOADING_INDICATION:
      return extend(appState, {
        isSubLoading: true,
      })

    case actions.HIDE_SUB_LOADING_INDICATION:
      return extend(appState, {
        isSubLoading: false,
      })
    case actions.CLEAR_SEED_WORD_CACHE:
      return extend(appState, {
        transForward: true,
        currentView: {},
        isLoading: false,
        accountDetail: {
          subview: 'transactions',
          accountExport: 'none',
          privateKey: '',
        },
      })

    case actions.DISPLAY_WARNING:
      return extend(appState, {
        warning: action.value,
        isLoading: false,
      })

    case actions.HIDE_WARNING:
      return extend(appState, {
        warning: undefined,
      })

    case actions.REQUEST_ACCOUNT_EXPORT:
      return extend(appState, {
        transForward: true,
        currentView: {
          name: 'accountDetail',
          context: appState.currentView.context,
        },
        accountDetail: {
          subview: 'export',
          accountExport: 'requested',
        },
      })

    case actions.EXPORT_ACCOUNT:
      return extend(appState, {
        accountDetail: {
          subview: 'export',
          accountExport: 'completed',
        },
      })

    case actions.SHOW_PRIVATE_KEY:
      return extend(appState, {
        accountDetail: {
          subview: 'export',
          accountExport: 'completed',
          privateKey: action.value,
        },
      })

    case actions.BUY_ETH_VIEW:
      return extend(appState, {
        transForward: true,
        currentView: {
          name: 'buyEth',
          context: appState.currentView.name,
        },
        identity: state.metamask.identities[action.value],
        buyView: {
          subview: 'Coinbase',
          amount: '15.00',
          buyAddress: action.value,
          formView: {
            coinbase: true,
            shapeshift: false,
          },
        },
      })

    case actions.ONBOARDING_BUY_ETH_VIEW:
      return extend(appState, {
        transForward: true,
        currentView: {
          name: 'onboardingBuyEth',
          context: appState.currentView.name,
        },
        identity: state.metamask.identities[action.value],
      })

    case actions.COINBASE_SUBVIEW:
      return extend(appState, {
        buyView: {
          subview: 'Coinbase',
          formView: {
            coinbase: true,
            shapeshift: false,
          },
          buyAddress: appState.buyView.buyAddress,
          amount: appState.buyView.amount,
        },
      })

    case actions.SHAPESHIFT_SUBVIEW:
      return extend(appState, {
        buyView: {
          subview: 'ShapeShift',
          formView: {
            coinbase: false,
            shapeshift: true,
            marketinfo: action.value.marketinfo,
            coinOptions: action.value.coinOptions,
          },
          buyAddress: action.value.buyAddress || appState.buyView.buyAddress,
          amount: appState.buyView.amount || 0,
        },
      })

    case actions.PAIR_UPDATE:
      return extend(appState, {
        buyView: {
          subview: 'ShapeShift',
          formView: {
            coinbase: false,
            shapeshift: true,
            marketinfo: action.value.marketinfo,
            coinOptions: appState.buyView.formView.coinOptions,
          },
          buyAddress: appState.buyView.buyAddress,
          amount: appState.buyView.amount,
          warning: null,
        },
      })

    case actions.SHOW_QR:
      return extend(appState, {
        qrRequested: true,
        transForward: true,

        Qr: {
          message: action.value.message,
          data: action.value.data,
        },
      })

    case actions.SHOW_QR_VIEW:
      return extend(appState, {
        currentView: {
          name: 'qr',
          context: appState.currentView.context,
        },
        transForward: true,
        Qr: {
          message: action.value.message,
          data: action.value.data,
        },
      })

    case actions.SET_MOUSE_USER_STATE:
      return extend(appState, {
        isMouseUser: action.value,
      })

    case actions.GAS_LOADING_STARTED:
      return extend(appState, {
        gasIsLoading: true,
      })

    case actions.GAS_LOADING_FINISHED:
      return extend(appState, {
        gasIsLoading: false,
      })

    case actions.SET_NETWORK_NONCE:
      return extend(appState, {
        networkNonce: action.value,
      })

    case actions.SET_PREVIOUS_PROVIDER:
      if (action.value === 'loading') {
        return appState
      }
      return extend(appState, {
        lastSelectedProvider: action.value,
      })

    case actions.SET_SELECTED_SETTINGS_RPC_URL:
      return extend(appState, {
        networksTabSelectedRpcUrl: action.value,
      })

    default:
      return appState
  }
}

function checkUnconfActions (state) {
  const unconfActionList = getUnconfActionList(state)
  const hasUnconfActions = unconfActionList.length > 0
  return hasUnconfActions
}

function getUnconfActionList (state) {
  const { unapprovedTxs, unapprovedMsgs,
    unapprovedPersonalMsgs, unapprovedTypedMessages, network } = state.metamask

  const unconfActionList = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, network)
  return unconfActionList
}

function indexForPending (state, txId) {
  const unconfTxList = getUnconfActionList(state)
  const match = unconfTxList.find((tx) => tx.id === txId)
  const index = unconfTxList.indexOf(match)
  return index
}

// function indexForLastPending (state) {
//   return getUnconfActionList(state).length
// }
