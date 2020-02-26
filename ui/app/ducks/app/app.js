import { actionConstants as actions } from '../../store/actions'

// Actions
const SET_THREEBOX_LAST_UPDATED = 'metamask/app/SET_THREEBOX_LAST_UPDATED'

export default function reduceApp (state = {}, action) {
  // default state
  const appState = Object.assign({
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
    networksTabIsInAddMode: false,
    loadingMethodData: false,
    show3BoxModalAfterImport: false,
    threeBoxLastUpdated: null,
    requestAccountTabs: {},
    openMetaMaskTabs: {},
    currentWindowTab: {},
  }, state)

  switch (action.type) {
    // dropdown methods
    case actions.NETWORK_DROPDOWN_OPEN:
      return {
        ...appState,
        networkDropdownOpen: true,
      }

    case actions.NETWORK_DROPDOWN_CLOSE:
      return {
        ...appState,
        networkDropdownOpen: false,
      }

    // sidebar methods
    case actions.SIDEBAR_OPEN:
      return {
        ...appState,
        sidebar: {
          ...action.value,
          isOpen: true,
        },
      }

    case actions.SIDEBAR_CLOSE:
      return {
        ...appState,
        sidebar: {
          ...appState.sidebar,
          isOpen: false,
        },
      }

    // alert methods
    case actions.ALERT_OPEN:
      return {
        ...appState,
        alertOpen: true,
        alertMessage: action.value,
      }

    case actions.ALERT_CLOSE:
      return {
        ...appState,
        alertOpen: false,
        alertMessage: null,
      }

    // qr scanner methods
    case actions.QR_CODE_DETECTED:
      return {
        ...appState,
        qrCodeData: action.value,
      }


    // modal methods:
    case actions.MODAL_OPEN:
      const { name, ...modalProps } = action.payload

      return {
        ...appState,
        modal: {
          open: true,
          modalState: {
            name: name,
            props: { ...modalProps },
          },
          previousModalState: { ...appState.modal.modalState },
        },
      }

    case actions.MODAL_CLOSE:
      return {
        ...appState,
        modal: Object.assign(
          appState.modal,
          { open: false },
          { modalState: { name: null, props: {} } },
          { previousModalState: appState.modal.modalState },
        ),
      }

    // transition methods
    case actions.TRANSITION_FORWARD:
      return {
        ...appState,
        transForward: true,
      }

    case actions.FORGOT_PASSWORD:
      return {
        ...appState,
        forgottenPassword: action.value,
      }

    case actions.SHOW_SEND_TOKEN_PAGE:
      return {
        ...appState,
        transForward: true,
        warning: null,
      }

      // unlock

    case actions.UNLOCK_METAMASK:
      return {
        ...appState,
        forgottenPassword: appState.forgottenPassword ? !appState.forgottenPassword : null,
        detailView: {},
        transForward: true,
        isLoading: false,
        warning: null,
      }

    case actions.LOCK_METAMASK:
      return {
        ...appState,
        transForward: false,
        warning: null,
      }

      // accounts

    case actions.GO_HOME:
      return {
        ...appState,
        accountDetail: {
          subview: 'transactions',
          accountExport: 'none',
          privateKey: '',
        },
        transForward: false,
        warning: null,
      }

    case actions.SHOW_ACCOUNT_DETAIL:
      return {
        ...appState,
        forgottenPassword: appState.forgottenPassword ? !appState.forgottenPassword : null,
        accountDetail: {
          subview: 'transactions',
          accountExport: 'none',
          privateKey: '',
        },
        transForward: false,
      }

    case actions.SHOW_ACCOUNTS_PAGE:
      return {
        ...appState,
        transForward: true,
        isLoading: false,
        warning: null,
        scrollToBottom: false,
        forgottenPassword: false,
      }

    case actions.SHOW_CONF_TX_PAGE:
      return {
        ...appState,
        txId: action.id,
        transForward: action.transForward,
        warning: null,
        isLoading: false,
      }

    case actions.COMPLETED_TX:
      if (action.value.unconfirmedActionsCount > 0) {
        return {
          ...appState,
          transForward: false,
          txId: null,
          warning: null,
        }
      } else {
        return {
          ...appState,
          // indicate notification should close
          shouldClose: true,
          transForward: false,
          warning: null,
          txId: null,
          accountDetail: {
            subview: 'transactions',
          },
        }
      }

    case actions.TRANSACTION_ERROR:
      return {
        ...appState,
      }

    case actions.UNLOCK_FAILED:
      return {
        ...appState,
        warning: action.value || 'Incorrect password. Try again.',
      }

    case actions.UNLOCK_SUCCEEDED:
      return {
        ...appState,
        warning: '',
      }

    case actions.SET_HARDWARE_WALLET_DEFAULT_HD_PATH:
      const { device, path } = action.value
      const newDefaults = { ...appState.defaultHdPaths }
      newDefaults[device] = path

      return {
        ...appState,
        defaultHdPaths: newDefaults,
      }

    case actions.SHOW_LOADING:
      return {
        ...appState,
        isLoading: true,
        loadingMessage: action.value,
      }

    case actions.HIDE_LOADING:
      return {
        ...appState,
        isLoading: false,
      }

    case actions.DISPLAY_WARNING:
      return {
        ...appState,
        warning: action.value,
        isLoading: false,
      }

    case actions.HIDE_WARNING:
      return {
        ...appState,
        warning: undefined,
      }

    case actions.SHOW_PRIVATE_KEY:
      return {
        ...appState,
        accountDetail: {
          subview: 'export',
          accountExport: 'completed',
          privateKey: action.value,
        },
      }

    case actions.SET_MOUSE_USER_STATE:
      return {
        ...appState,
        isMouseUser: action.value,
      }

    case actions.GAS_LOADING_STARTED:
      return {
        ...appState,
        gasIsLoading: true,
      }

    case actions.GAS_LOADING_FINISHED:
      return {
        ...appState,
        gasIsLoading: false,
      }

    case actions.SET_NETWORK_NONCE:
      return {
        ...appState,
        networkNonce: action.value,
      }

    case actions.SET_PREVIOUS_PROVIDER:
      if (action.value === 'loading') {
        return appState
      }
      return {
        ...appState,
        lastSelectedProvider: action.value,
      }

    case actions.SET_SELECTED_SETTINGS_RPC_URL:
      return {
        ...appState,
        networksTabSelectedRpcUrl: action.value,
      }

    case actions.SET_NETWORKS_TAB_ADD_MODE:
      return {
        ...appState,
        networksTabIsInAddMode: action.value,
      }

    case actions.LOADING_METHOD_DATA_STARTED:
      return {
        ...appState,
        loadingMethodData: true,
      }

    case actions.LOADING_METHOD_DATA_FINISHED:
      return {
        ...appState,
        loadingMethodData: false,
      }

    case SET_THREEBOX_LAST_UPDATED:
      return {
        ...appState,
        threeBoxLastUpdated: action.value,
      }

    case actions.SET_REQUEST_ACCOUNT_TABS:
      return {
        ...appState,
        requestAccountTabs: action.value,
      }

    case actions.SET_OPEN_METAMASK_TAB_IDS:
      return {
        ...appState,
        openMetaMaskTabs: action.value,
      }

    case actions.SET_CURRENT_WINDOW_TAB:
      return {
        ...appState,
        currentWindowTab: action.value,
      }

    default:
      return appState
  }
}

// Action Creators
export function setThreeBoxLastUpdated (lastUpdated) {
  return {
    type: SET_THREEBOX_LAST_UPDATED,
    value: lastUpdated,
  }
}
