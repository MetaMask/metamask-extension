const extend = require('xtend')
const actions = require('../actions')
const valuesFor = require('../util').valuesFor
const txHelper = require('../../lib/tx-helper')

module.exports = reduceApp

function reduceApp(state, action) {

  // clone and defaults
  const selectedAccount = state.metamask.selectedAccount
  const pendingTxs = hasPendingTxs(state)
  let name = 'accounts'
  if (selectedAccount) {
    defaultView = 'accountDetail'
  }
  if (pendingTxs) {
    defaultView = 'confTx'
  }

  var defaultView = {
    name,
    detailView: null,
    context: selectedAccount,
  }

  // confirm seed words
  var seedConfView = {
    name: 'createVaultComplete',
  }
  var seedWords = state.metamask.seedWords

  var appState = extend({
    menuOpen: false,
    currentView: seedWords ? seedConfView : defaultView,
    accountDetail: {
      subview: 'transactions',
    },
    currentDomain: 'example.com',
    transForward: true, // Used to render transition direction
    isLoading: false,   // Used to display loading indicator
    warning: null,      // Used to display error text
  }, state.appState)

  switch (action.type) {

  case actions.TOGGLE_MENU:
    return extend(appState, {
      menuOpen: !appState.menuOpen,
    })

  case actions.SET_MENU_STATE:
    return extend(appState, {
      menuOpen: action.value,
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
      transForward: true,
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
        context: action.value,
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
    })

  case actions.SHOW_ACCOUNT_DETAIL:
    return extend(appState, {
      currentView: {
        name: 'accountDetail',
        context: action.value || account,
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
    var seedWords = state.metamask.seedWords
    return extend(appState, {
      currentView: {
        name: seedWords ? 'createVaultComplete' : 'accounts',
      },
      transForward: true,
      isLoading: false,
      warning: null,
      scrollToBottom: false,
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
      transForward: true,
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

    var unconfTxList = txHelper(unconfTxs, unconfMsgs)
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
      }
    })

  case actions.PREVIOUS_TX:
    return extend(appState, {
      transForward: false,
      currentView: {
        name: 'confTx',
        context: --appState.currentView.context,
        warning: null,
      }
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
      warning: 'Incorrect password. Try again.'
    })

  case actions.SHOW_LOADING:
    return extend(appState, {
      isLoading: true,
    })

  case actions.HIDE_LOADING:
    return extend(appState, {
      isLoading: false,
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

  case  actions.EXPORT_ACCOUNT:
    return extend(appState, {
      accountDetail: {
        subview: 'export',
        accountExport: 'completed',
      },
    })

  case  actions.SHOW_PRIVATE_KEY:
    return extend(appState, {
      accountDetail: {
        subview: 'export',
        accountExport: 'completed',
        privateKey: action.value,
      },
    })

  default:
    return appState

  }
}

function hasPendingTxs (state) {
  var unconfTxs = state.metamask.unconfTxs
  var unconfMsgs = state.metamask.unconfMsgs
  var unconfTxList = txHelper(unconfTxs, unconfMsgs)
  return unconfTxList.length > 0
}
