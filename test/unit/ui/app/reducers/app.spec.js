import assert from 'assert'
import reduceApp from '../../../../../ui/app/ducks/app/app'
import * as actions from '../../../../../ui/app/store/actions'

describe('App State', () => {

  const metamaskState = {
    metamask: {
      selectedAddress: '0xAddress',
      identities: {
        '0xAddress': {
          name: 'account 1',
          address: '0xAddress',
        },
      },
    },
  }

  it('App init state', () => {
    const initState = reduceApp(metamaskState, {})

    assert(initState)
  })

  it('sets networkd dropdown to true', () => {
    const state = reduceApp(metamaskState, {
      type: actions.NETWORK_DROPDOWN_OPEN,
    })

    assert.equal(state.networkDropdownOpen, true)
  })

  it('sets networkd dropdown to false', () => {
    const dropdown = { networkDropdowopen: true }
    const state = {...metamaskState, ...dropdown}
    const newState = reduceApp(state, {
      type: actions.NETWORK_DROPDOWN_CLOSE,
    })

    assert.equal(newState.networkDropdownOpen, false)
  })

  it('opens sidebar', () => {
    const value = {
      'transitionName': 'sidebar-right',
      'type': 'wallet-view',
      'isOpen': true,
    }
    const state = reduceApp(metamaskState, {
      type: actions.SIDEBAR_OPEN,
      value,
    })

    assert.deepEqual(state.sidebar, value)
  })

  it('closes sidebar', () => {
    const openSidebar = { sidebar: { isOpen: true }}
    const state = {...metamaskState, ...openSidebar}

    const newState = reduceApp(state, {
      type: actions.SIDEBAR_CLOSE,
    })

    assert.equal(newState.sidebar.isOpen, false)
  })

  it('opens alert', () => {
    const state = reduceApp(metamaskState, {
      type: actions.ALERT_OPEN,
      value: 'test message',
    })

    assert.equal(state.alertOpen, true)
    assert.equal(state.alertMessage, 'test message')
  })

  it('closes alert', () => {
    const alert = { alertOpen: true, alertMessage: 'test message' }
    const state = {...metamaskState, ...alert}
    const newState = reduceApp(state, {
      type: actions.ALERT_CLOSE,
    })

    assert.equal(newState.alertOpen, false)
    assert.equal(newState.alertMessage, null)
  })

  it('detects qr code data', () => {
    const state = reduceApp(metamaskState, {
      type: actions.QR_CODE_DETECTED,
      value: 'qr data',
    })

    assert.equal(state.qrCodeData, 'qr data')
  })

  it('opens modal', () => {
    const state = reduceApp(metamaskState, {
      type: actions.MODAL_OPEN,
      payload: {
        name: 'test',
      },
    })

    assert.equal(state.modal.open, true)
    assert.equal(state.modal.modalState.name, 'test')
  })

  it('closes modal, but moves open modal state to previous modal state', () => {
    const opensModal = {
      modal: {
        open: true,
        modalState: {
          name: 'test',
        },
      },
    }

    const state = { ...metamaskState, appState: { ...opensModal } }
    const newState = reduceApp(state, {
      type: actions.MODAL_CLOSE,
    })


    assert.equal(newState.modal.open, false)
    assert.equal(newState.modal.modalState.name, null)
  })

  it('tansitions forwards', () => {
    const state = reduceApp(metamaskState, {
      type: actions.TRANSITION_FORWARD,
    })

    assert.equal(state.transForward, true)
  })

  it('transition backwards', () => {
    const transitionForwardState = { transitionForward: true }

    const state = { ...metamaskState, ...transitionForwardState }
    const newState = reduceApp(state, {
      type: actions.TRANSITION_BACKWARD,
    })

    assert.equal(newState.transForward, false)
  })

  it('shows create vault', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_CREATE_VAULT,
    })

    assert.equal(state.currentView.name, 'createVault')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('shows restore vault', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_RESTORE_VAULT,
    })

    assert.equal(state.currentView.name, 'restoreVault')
    assert.equal(state.transForward, true)
    assert.equal(state.forgottenPassword, true)
  })

  it('sets forgot password', () => {
    const state = reduceApp(metamaskState, {
      type: actions.FORGOT_PASSWORD,
      value: true,
    })

    assert.equal(state.currentView.name, 'restoreVault')
  })

  it('shows init menu', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_INIT_MENU,
    })

    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.currentView.context, '0xAddress')
  })

  it('shows config page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_CONFIG_PAGE,
      value: true,
    })

    assert.equal(state.currentView.name, 'config')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
  })

  it('shows add token page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ADD_TOKEN_PAGE,
      value: true,
    })

    assert.equal(state.currentView.name, 'add-token')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
  })

  it('shows add suggested token page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ADD_SUGGESTED_TOKEN_PAGE,
      value: true,
    })

    assert.equal(state.currentView.name, 'add-suggested-token')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
  })

  it('shows import page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_IMPORT_PAGE,
    })

    assert.equal(state.currentView.name, 'import-menu')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('shows new account page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_NEW_ACCOUNT_PAGE,
      formToSelect: 'context',
    })

    assert.equal(state.currentView.name, 'new-account-page')
    assert.equal(state.currentView.context, 'context')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('sets new account form', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SET_NEW_ACCOUNT_FORM,
      formToSelect: 'context',
    })

    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.currentView.context, 'context')
  })

  it('shows info page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_INFO_PAGE,
    })

    assert.equal(state.currentView.name, 'info')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
  })

  it('creates new vault in progress', () => {
    const state = reduceApp(metamaskState, {
      type: actions.CREATE_NEW_VAULT_IN_PROGRESS,
    })

    assert.equal(state.currentView.name, 'createVault')
    assert.equal(state.currentView.inProgress, true)
    assert.equal(state.transForward, true)
    assert.equal(state.isLoading, true)
  })

  it('shows new account screen', () => {
    const state = reduceApp(metamaskState, {
      type: actions.NEW_ACCOUNT_SCREEN,
    })

    assert.equal(state.currentView.name, 'new-account')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
  })

  it('shows send page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_SEND_PAGE,
    })

    assert.equal(state.currentView.name, 'sendTransaction')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('shows send token page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_SEND_TOKEN_PAGE,
    })

    assert.equal(state.currentView.name, 'sendToken')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('shows new keychain', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_NEW_KEYCHAIN,
    })

    assert.equal(state.currentView.name, 'newKeychain')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, true)
  })

  it('unlocks Metamask', () => {
    const state = reduceApp(metamaskState, {
      type: actions.UNLOCK_METAMASK,
    })

    assert.equal(state.forgottenPassword, null)
    assert.deepEqual(state.detailView, {})
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('locks Metamask', () => {
    const state = reduceApp(metamaskState, {
      type: actions.LOCK_METAMASK,
    })

    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, false)
    assert.equal(state.warning, null)
  })

  it('goes back to init menu', () => {
    const state = reduceApp(metamaskState, {
      type: actions.BACK_TO_INIT_MENU,
    })

    assert.equal(state.currentView.name, 'InitMenu')
    assert.equal(state.transForward, false)
    assert.equal(state.warning, null)
    assert.equal(state.forgottenPassword, true)
  })

  it('goes back to unlock view', () => {
    const state = reduceApp(metamaskState, {
      type: actions.BACK_TO_UNLOCK_VIEW,
    })

    assert.equal(state.currentView.name, 'UnlockScreen')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
    assert.equal(state.forgottenPassword, false)
  })

  it('reveals seed words', () => {
    const state = reduceApp(metamaskState, {
      type: actions.REVEAL_SEED_CONFIRMATION,
    })

    assert.equal(state.currentView.name, 'reveal-seed-conf')
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
  })

  it('sets selected account', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SET_SELECTED_ACCOUNT,
      value: 'active address',
    })

    assert.equal(state.activeAddress, 'active address')
  })

  it('goes home', () => {
    const state = reduceApp(metamaskState, {
      type: actions.GO_HOME,
    })

    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.accountDetail.subview, 'transactions')
    assert.equal(state.accountDetail.accountExport, 'none')
    assert.equal(state.accountDetail.privateKey, '')
    assert.equal(state.transForward, false)
    assert.equal(state.warning, null)

  })

  it('shows account detail', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ACCOUNT_DETAIL,
      value: 'context address',
    })
    assert.equal(state.forgottenPassword, null) // default
    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.currentView.context, 'context address')
    assert.equal(state.accountDetail.subview, 'transactions') // default
    assert.equal(state.accountDetail.accountExport, 'none') // default
    assert.equal(state.accountDetail.privateKey, '') // default
    assert.equal(state.transForward, false)

  })

  it('goes back to account detail', () => {
    const state = reduceApp(metamaskState, {
      type: actions.BACK_TO_ACCOUNT_DETAIL,
      value: 'context address',
    })
    assert.equal(state.forgottenPassword, null) // default
    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.currentView.context, 'context address')
    assert.equal(state.accountDetail.subview, 'transactions') // default
    assert.equal(state.accountDetail.accountExport, 'none') // default
    assert.equal(state.accountDetail.privateKey, '') // default
    assert.equal(state.transForward, false)

  })

  it('shoes account page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ACCOUNTS_PAGE,
    })

    assert.equal(state.currentView.name, 'accounts')
    assert.equal(state.transForward, true)
    assert.equal(state.isLoading, false)
    assert.equal(state.warning, null)
    assert.equal(state.scrollToBottom, false)
    assert.equal(state.forgottenPassword, false)
  })

  it('reveals account', () => {
    const state = reduceApp(metamaskState, {
      type: actions.REVEAL_ACCOUNT,
    })
    assert.equal(state.scrollToBottom, true)
  })

  it('shows confirm tx page', () => {
    const txs = {
      unapprovedTxs: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
    }
    const oldState = {
      metamask: {...metamaskState.metamask, ...txs},
    }
    const state = reduceApp(oldState, {
      type: actions.SHOW_CONF_TX_PAGE,
      id: 2,
      transForward: false,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.context, 1)
    assert.equal(state.transForward, false)
    assert.equal(state.warning, null)
    assert.equal(state.isLoading, false)

  })

  it('shows confirm msg page', () => {
    const msgs = {
      unapprovedMsgs: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
    }

    const oldState = {
      metamask: {...metamaskState, ...msgs},
    }

    const state = reduceApp(oldState, {
      type: actions.SHOW_CONF_MSG_PAGE,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.context, 0)
    assert.equal(state.transForward, true)
    assert.equal(state.warning, null)
    assert.equal(state.isLoading, false)

  })

  it('completes tx continues to show pending txs current view context', () => {
    const txs = {
      unapprovedTxs: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
    }

    const oldState = {
      metamask: {...metamaskState, ...txs},
    }

    const state = reduceApp(oldState, {
      type: actions.COMPLETED_TX,
      value: 1,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.context, 0)
    assert.equal(state.transForward, false)
    assert.equal(state.warning, null)
  })

  it('returns to account detail page when no unconf actions completed tx', () => {
    const state = reduceApp(metamaskState, {
      type: actions.COMPLETED_TX,
    })

    assert.equal(state.currentView.name, 'accountDetail')
    assert.equal(state.currentView.context, '0xAddress')
    assert.equal(state.transForward, false)
    assert.equal(state.warning, null)
    assert.equal(state.accountDetail.subview, 'transactions')

  })

  it('proceeds to change current view context in confTx', () => {

    const oldState = {
      metamask: {metamaskState},
      appState: {currentView: {context: 0}},
    }

    const state = reduceApp(oldState, {
      type: actions.NEXT_TX,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.context, 1)
    assert.equal(state.warning, null)
  })

  it('views pending tx', () => {
    const txs = {
      unapprovedTxs: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
    }


    const oldState = {
      metamask: {...metamaskState, ...txs},
    }

    const state = reduceApp(oldState, {
      type: actions.VIEW_PENDING_TX,
      value: 2,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.context, 1)
    assert.equal(state.warning, null)
  })

  it('views previous tx', () => {
    const txs = {
      unapprovedTxs: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
    }


    const oldState = {
      metamask: {...metamaskState, ...txs},
    }

    const state = reduceApp(oldState, {
      type: actions.VIEW_PENDING_TX,
      value: 2,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.context, 1)
    assert.equal(state.warning, null)
  })

  it('sets error message in confTx view', () => {
    const state = reduceApp(metamaskState, {
      type: actions.TRANSACTION_ERROR,
    })

    assert.equal(state.currentView.name, 'confTx')
    assert.equal(state.currentView.errorMessage, 'There was a problem submitting this transaction.')
  })

  it('sets default warning when unlock fails', () => {
    const state = reduceApp(metamaskState, {
      type: actions.UNLOCK_FAILED,
    })

    assert.equal(state.warning, 'Incorrect password. Try again.')
  })

  it('sets default warning when unlock fails', () => {
    const state = reduceApp(metamaskState, {
      type: actions.UNLOCK_FAILED,
      value: 'errors',
    })

    assert.equal(state.warning, 'errors')
  })

  it('sets warning to empty string when unlock succeeds', () => {
    const errorState = { warning: 'errors' }
    const oldState = {...metamaskState, ...errorState}
    const state = reduceApp(oldState, {
      type: actions.UNLOCK_SUCCEEDED,
    })

    assert.equal(state.warning, '')
  })

  it('sets hardware wallet default hd path', () => {
    const hdPaths = {
      trezor: "m/44'/60'/0'/0",
      ledger: "m/44'/60'/0'",
    }
    const state = reduceApp(metamaskState, {
      type: actions.SET_HARDWARE_WALLET_DEFAULT_HD_PATH,
      value: {
        device: 'ledger',
        path: "m/44'/60'/0'",
      },
    })

    assert.deepEqual(state.defaultHdPaths, hdPaths)
  })

  it('shows loading message', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_LOADING,
      value: 'loading',
    })

    assert.equal(state.isLoading, true)
    assert.equal(state.loadingMessage, 'loading')
  })

  it('hides loading message', () => {
    const loadingState = { isLoading: true}
    const oldState = {...metamaskState, ...loadingState}

    const state = reduceApp(oldState, {
      type: actions.HIDE_LOADING,
    })

    assert.equal(state.isLoading, false)
  })

  it('shows sub loading indicator', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_SUB_LOADING_INDICATION,
    })

    assert.equal(state.isSubLoading, true)
  })

  it('hides sub loading indicator', () => {
    const oldState = {...metamaskState, isSubLoading: true }
    const state = reduceApp(oldState, {
      type: actions.HIDE_SUB_LOADING_INDICATION,
    })

    assert.equal(state.isSubLoading, false)
  })

  it('displays warning', () => {
    const state = reduceApp(metamaskState, {
      type: actions.DISPLAY_WARNING,
      value: 'warning',
    })

    assert.equal(state.isLoading, false)
    assert.equal(state.warning, 'warning')
  })

  it('hides warning', () => {
    const displayWarningState = { warning: 'warning'}
    const oldState = {...metamaskState, ...displayWarningState}
    const state = reduceApp(oldState, {
      type: actions.HIDE_WARNING,
    })

    assert.equal(state.warning, undefined)
  })

  it('request to display account export', () => {
    const state = reduceApp(metamaskState, {
      type: actions.REQUEST_ACCOUNT_EXPORT,
    })

    assert.equal(state.transForward, true)
    assert.equal(state.accountDetail.subview, 'export')
    assert.equal(state.accountDetail.accountExport, 'requested')
  })

  it('completes account export', () => {
    const requestAccountExportState = {
      accountDetail: {
        subview: 'something',
        accountExport: 'progress',
      },
    }
    const oldState = {...metamaskState, ...requestAccountExportState}
    const state = reduceApp(oldState, {
      type: actions.EXPORT_ACCOUNT,
    })

    assert.equal(state.accountDetail.subview, 'export')
    assert.equal(state.accountDetail.accountExport, 'completed')
  })

  it('shows private key', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_PRIVATE_KEY,
      value: 'private key',
    })

    assert.equal(state.accountDetail.subview, 'export')
    assert.equal(state.accountDetail.accountExport, 'completed')
    assert.equal(state.accountDetail.privateKey, 'private key')
  })

  it('shows buy eth view', () => {

    const state = reduceApp(metamaskState, {
      type: actions.BUY_ETH_VIEW,
      value: '0xAddress',
    })

    assert.equal(state.currentView.name, 'buyEth')
    assert.equal(state.currentView.context, 'accountDetail')
    assert.equal(state.identity.address, '0xAddress')
    assert.equal(state.buyView.subview, 'Coinbase')
    assert.equal(state.buyView.amount, '15.00')
    assert.equal(state.buyView.buyAddress, '0xAddress')
    assert.equal(state.buyView.formView.coinbase, true)
    assert.equal(state.buyView.formView.shapeshift, false)
  })

  it('shows onboarding subview to buy eth', () => {
    const state = reduceApp(metamaskState, {
      type: actions.ONBOARDING_BUY_ETH_VIEW,
      value: '0xAddress',
    })

    assert.equal(state.currentView.name, 'onboardingBuyEth')
    assert.equal(state.currentView.context, 'accountDetail')
    assert.equal(state.identity.address, '0xAddress')
  })

  it('shows coinbase subview', () => {
    const appState = {
      appState: {
        buyView: {
          buyAddress: '0xAddress',
          amount: '12.00',
        },
      },
    }
    const oldState = {...metamaskState, ...appState}
    const state = reduceApp(oldState, {
      type: actions.COINBASE_SUBVIEW,
    })

    assert.equal(state.buyView.subview, 'Coinbase')
    assert.equal(state.buyView.formView.coinbase, true)
    assert.equal(state.buyView.buyAddress, '0xAddress')
    assert.equal(state.buyView.amount, '12.00')
  })

  it('shows shapeshift subview', () => {
    const appState = {
      appState: {
        buyView: {
          buyAddress: '0xAddress',
          amount: '12.00',
        },
      },
    }

    const marketinfo = {
      pair: 'BTC_ETH',
      rate: 28.91191106,
      minerFee: 0.0022,
      limit: 0.76617432,
      minimum: 0.00015323,
      maxLimit: 0.76617432,
    }

    const coinOptions = {
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://shapeshift.io/images/coins/bitcoin.png',
        imageSmall: 'https://shapeshift.io/images/coins-sm/bitcoin.png',
        status: 'available',
        minerFee: 0.00025,
      },
    }

    const oldState = {...metamaskState, ...appState}

    const state = reduceApp(oldState, {
      type: actions.SHAPESHIFT_SUBVIEW,
      value: {
        marketinfo,
        coinOptions,
      },
    })

    assert.equal(state.buyView.subview, 'ShapeShift')
    assert.equal(state.buyView.formView.shapeshift, true)
    assert.deepEqual(state.buyView.formView.marketinfo, marketinfo)
    assert.deepEqual(state.buyView.formView.coinOptions, coinOptions)
    assert.equal(state.buyView.buyAddress, '0xAddress')
    assert.equal(state.buyView.amount, '12.00')
  })

  it('updates pair', () => {
    const coinOptions = {
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://shapeshift.io/images/coins/bitcoin.png',
        imageSmall: 'https://shapeshift.io/images/coins-sm/bitcoin.png',
        status: 'available',
        minerFee: 0.00025,
      },
    }

    const appState = {
      appState: {
        buyView: {
          buyAddress: '0xAddress',
          amount: '12.00',
          formView: {
            coinOptions,
          },
        },
      },
    }

    const marketinfo = {
      pair: 'BTC_ETH',
      rate: 28.91191106,
      minerFee: 0.0022,
      limit: 0.76617432,
      minimum: 0.00015323,
      maxLimit: 0.76617432,
    }

    const oldState = {...metamaskState, ...appState}

    const state = reduceApp(oldState, {
      type: actions.PAIR_UPDATE,
      value: {
        marketinfo,
      },
    })

    assert.equal(state.buyView.subview, 'ShapeShift')
    assert.equal(state.buyView.formView.shapeshift, true)
    assert.deepEqual(state.buyView.formView.marketinfo, marketinfo)
    assert.deepEqual(state.buyView.formView.coinOptions, coinOptions)
    assert.equal(state.buyView.buyAddress, '0xAddress')
    assert.equal(state.buyView.amount, '12.00')
  })

  it('shows QR', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_QR,
      value: {
        message: 'message',
        data: 'data',
      },
    })

    assert.equal(state.qrRequested, true)
    assert.equal(state.transForward, true)
    assert.equal(state.Qr.message, 'message')
    assert.equal(state.Qr.data, 'data')
  })

  it('shows qr view', () => {
    const appState = {
      appState: {
        currentView: {
          context: 'accounts',
        },
      },
    }

    const oldState = {...metamaskState, ...appState}
    const state = reduceApp(oldState, {
      type: actions.SHOW_QR_VIEW,
      value: {
        message: 'message',
        data: 'data',
      },
    })

    assert.equal(state.currentView.name, 'qr')
    assert.equal(state.currentView.context, 'accounts')
    assert.equal(state.transForward, true)
    assert.equal(state.Qr.message, 'message')
    assert.equal(state.Qr.data, 'data')
  })

  it('set mouse user state', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SET_MOUSE_USER_STATE,
      value: true,
    })

    assert.equal(state.isMouseUser, true)
  })

  it('sets gas loading', () => {
    const state = reduceApp(metamaskState, {
      type: actions.GAS_LOADING_STARTED,
    })

    assert.equal(state.gasIsLoading, true)
  })

  it('unsets gas loading', () => {
    const gasLoadingState = { gasIsLoading: true }
    const oldState = {...metamaskState, ...gasLoadingState}
    const state = reduceApp(oldState, {
      type: actions.GAS_LOADING_FINISHED,
    })

    assert.equal(state.gasIsLoading, false)
  })

  it('sets network nonce', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SET_NETWORK_NONCE,
      value: '33',
    })

    assert.equal(state.networkNonce, '33')
  })
})
