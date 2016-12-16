const extend = require('xtend')
const actions = require('../actions')
const txHelper = require('../../lib/tx-helper')
const notification = require('../../../app/scripts/lib/notifications')

module.exports = reduceApp

function reduceApp (state, action) {
  // clone and defaults
  const selectedAccount = state.metamask.selectedAccount
  const pendingTxs = hasPendingTxs(state)
  let name = 'accounts'
  if (selectedAccount) {
    name = 'accountDetail'
  }
  if (pendingTxs) {
    name = 'confTx'
  }

  var defaultView = {
    name,
    detailView: null,
    context: selectedAccount,
  }

  // confirm seed words
  var seedWords = state.metamask.seedWords
  var seedConfView = {
    name: 'createVaultComplete',
    seedWords,
  }
  var ethStoreWarning = {
    name: 'EthStoreWarning',
  }

  var appState = extend({
    menuOpen: false,
    currentView: seedWords ? seedConfView : !state.metamask.isEthConfirmed ? ethStoreWarning : defaultView,
    accountDetail: {
      subview: 'transactions',
    },
    transForward: true, // Used to render transition direction
    isLoading: false,   // Used to display loading indicator
    warning: null,      // Used to display error text
  }, state.appState)

  switch (action.type) {

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
      })

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

    case actions.SHOW_SEND_PAGE:
      return extend(appState, {
        currentView: {
          name: 'sendTransaction',
          context: appState.currentView.context,
        },
        transForward: true,
        warning: null,
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
        forgottenPassword: !appState.forgottenPassword,
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
      })

    case actions.SHOW_NOTICE:
      return extend(appState, {
        transForward: true,
        isLoading: false,
      })

    case actions.REVEAL_ACCOUNT:
      return extend(appState, {
        scrollToBottom: true,
      })

    case actions.SHOW_CONF_TX_PAGE:
      return extend(appState, {
        currentView: {
          name: 'confTx',
          context: 0,
        },
        transForward: action.transForward,
        warning: null,
      })

    case actions.SHOW_CONF_MSG_PAGE:
      return extend(appState, {
        currentView: {
          name: 'confTx',
          context: 0,
        },
        transForward: true,
        warning: null,
      })

    case actions.COMPLETED_TX:
      var unconfTxs = state.metamask.unconfTxs
      var unconfMsgs = state.metamask.unconfMsgs
      var network = state.metamask.network

      var unconfTxList = txHelper(unconfTxs, unconfMsgs, network)
    .filter(tx => tx !== tx.id)

      if (unconfTxList && unconfTxList.length > 0) {
        return extend(appState, {
          transForward: false,
          currentView: {
            name: 'confTx',
            context: 0,
          },
          warning: null,
        })
      } else {

        notification.closePopup()

        return extend(appState, {
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
        warning: 'Incorrect password. Try again.',
      })

    case actions.SHOW_LOADING:
      return extend(appState, {
        isLoading: true,
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
        buyView: {
          subview: 'buyForm',
          amount: '5.00',
          buyAddress: action.value,
          formView: {
            coinbase: true,
            shapeshift: false,
          },
        },
      })

    case actions.UPDATE_BUY_ADDRESS:
      return extend(appState, {
        buyView: {
          subview: 'buyForm',
          formView: {
            coinbase: appState.buyView.formView.coinbase,
            shapeshift: appState.buyView.formView.shapeshift,
          },
          buyAddress: action.value,
          amount: appState.buyView.amount,
        },
      })

    case actions.UPDATE_COINBASE_AMOUNT:
      return extend(appState, {
        buyView: {
          subview: 'buyForm',
          formView: {
            coinbase: true,
            shapeshift: false,
          },
          buyAddress: appState.buyView.buyAddress,
          amount: action.value,
        },
      })

    case actions.COINBASE_SUBVIEW:
      return extend(appState, {
        buyView: {
          subview: 'buyForm',
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
          subview: 'buyForm',
          formView: {
            coinbase: false,
            shapeshift: true,
            marketinfo: action.value.marketinfo,
            coinOptions: action.value.coinOptions,
          },
          buyAddress: appState.buyView.buyAddress,
          amount: appState.buyView.amount,
        },
      })

    case actions.PAIR_UPDATE:
      return extend(appState, {
        buyView: {
          subview: 'buyForm',
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
    default:
      return appState
  }
}

function hasPendingTxs (state) {
  var unconfTxs = state.metamask.unconfTxs
  var unconfMsgs = state.metamask.unconfMsgs
  var network = state.metamask.network
  var unconfTxList = txHelper(unconfTxs, unconfMsgs, network)
  return unconfTxList.length > 0
}

function indexForPending (state, txId) {
  var unconfTxs = state.metamask.unconfTxs
  var unconfMsgs = state.metamask.unconfMsgs
  var network = state.metamask.network
  var unconfTxList = txHelper(unconfTxs, unconfMsgs, network)
  let idx
  unconfTxList.forEach((tx, i) => {
    if (tx.id === txId) {
      idx = i
    }
  })
  return idx
}

