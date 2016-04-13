const extend = require('xtend')
const actions = require('../actions')

module.exports = reduceApp

function reduceApp(state, action) {

  // clone and defaults
  var defaultView = {
    name: 'accounts',
    detailView: null,
  }

  // confirm seed words
  var seedConfView = {
    name: 'createVaultComplete',
  }
  var seedWords = state.metamask.seedWords

  var appState = extend({
    currentView: seedWords ? seedConfView : defaultView,
    currentDomain: 'example.com',
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
      },
      transForward: true,
    })

  case actions.SHOW_INFO_PAGE:
    return extend(appState, {
      currentView: {
        name: 'info',
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
      transForward: true,
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

  case actions.SHOW_ACCOUNT_DETAIL:
    return extend(appState, {
      currentView: {
        name: 'accountDetail',
        context: action.value,
      },
      accountDetail: {
        accountExport: 'none',
        privateKey: '',
      },
      transForward: true,
    })

  case actions.BACK_TO_ACCOUNT_DETAIL:
    return extend(appState, {
      currentView: {
        name: 'accountDetail',
        context: action.value,
      },
      accountDetail: {
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
      transForward: appState.currentView.name == 'locked',
      isLoading: false,
      warning: null,
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

  case actions.COMPLETED_TX:
    var unconfTxs = Object.keys(state.metamask.unconfTxs).filter(tx => tx !== tx.id)
    if (unconfTxs && unconfTxs.length > 0) {
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
        currentView: {
          name: 'accounts',
          context: 0,
        },
        transForward: false,
        warning: null,
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
      currentView: {
        name: 'accounts',
      },
      isLoading: false,
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
      accountDetail: {
        accountExport: 'requested',
      },
    })

  case  actions.EXPORT_ACCOUNT:
    return extend(appState, {
      accountDetail: {
        accountExport: 'completed',
      },
    })

  case  actions.SHOW_PRIVATE_KEY:
    return extend(appState, {
      accountDetail: {
        accountExport: 'completed',
        privateKey: action.value,
      },
    })

  default:
    return appState

  }
}
