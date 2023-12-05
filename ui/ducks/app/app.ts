import { AnyAction, Action } from 'redux';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  WebHIDConnectedStatuses,
  HardwareTransportStates,
} from '../../../shared/constants/hardware-wallets';
import * as actionConstants from '../../store/actionConstants';

interface AppState {
  shouldClose: boolean;
  menuOpen: boolean;
  modal: {
    open: boolean;
    modalState: {
      name: string | null;
      props: Record<string, any>;
    };
    previousModalState: {
      name: string | null;
    };
  };
  alertOpen: boolean;
  alertMessage: string | null;
  qrCodeData: {
    type?: string | null;
    values?: { address?: string | null };
  } | null;
  networkDropdownOpen: boolean;
  importNftsModal: {
    open: boolean;
    tokenAddress?: string;
    tokenId?: string;
    ignoreErc20Token?: boolean;
  };
  showIpfsModalOpen: boolean;
  keyringRemovalSnapModal: {
    snapName: string;
    result: 'success' | 'failure' | 'none';
  };
  showKeyringRemovalSnapModal: boolean;
  importTokensModalOpen: boolean;
  showSelectActionModal: boolean;
  accountDetail: {
    subview?: string;
    accountExport?: string;
    privateKey?: string;
  };
  isLoading: boolean;
  loadingMessage: string | null;
  scrollToBottom: boolean;
  warning: string | null | undefined;
  buyView: Record<string, any>;
  defaultHdPaths: {
    trezor: string;
    ledger: string;
    lattice: string;
  };
  networksTabSelectedRpcUrl: string | null;
  requestAccountTabs: Record<string, number>; // [url.origin]: tab.id
  openMetaMaskTabs: Record<string, boolean>; // openMetamaskTabsIDs[tab.id]): true/false
  currentWindowTab: Record<string, any>; // tabs.tab https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
  showWhatsNewPopup: boolean;
  showTermsOfUsePopup: boolean;
  singleExceptions: {
    testKey: string | null;
  };
  gasLoadingAnimationIsShowing: boolean;
  smartTransactionsError: string | null;
  smartTransactionsErrorMessageDismissed: boolean;
  ledgerWebHidConnectedStatus: WebHIDConnectedStatuses;
  ledgerTransportStatus: HardwareTransportStates;
  newNftAddedMessage: string;
  removeNftMessage: string;
  newNetworkAddedName: string;
  newNetworkAddedConfigurationId: string;
  selectedNetworkConfigurationId: string;
  sendInputCurrencySwitched: boolean;
  newTokensImported: string;
  onboardedInThisUISession: boolean;
  customTokenAmount: string;
  txId: string | null;
  accountDetailsAddress: string;
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  snapsInstallPrivacyWarningShown: boolean;
  ///: END:ONLY_INCLUDE_IF
}

interface AppSliceState {
  appState: AppState;
}

// default state
const initialState: AppState = {
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
  alertOpen: false,
  alertMessage: null,
  qrCodeData: null,
  networkDropdownOpen: false,
  importNftsModal: { open: false },
  showIpfsModalOpen: false,
  keyringRemovalSnapModal: {
    snapName: '',
    result: 'none',
  },
  showKeyringRemovalSnapModal: false,
  importTokensModalOpen: false,
  showSelectActionModal: false,
  accountDetail: {
    privateKey: '',
  },
  // Used to display loading indicator
  isLoading: false,
  loadingMessage: null,
  // Used to display error text
  warning: null,
  buyView: {},
  defaultHdPaths: {
    trezor: `m/44'/60'/0'/0`,
    ledger: `m/44'/60'/0'/0/0`,
    lattice: `m/44'/60'/0'/0`,
  },
  networksTabSelectedRpcUrl: '',
  requestAccountTabs: {},
  openMetaMaskTabs: {},
  currentWindowTab: {},
  showWhatsNewPopup: true,
  showTermsOfUsePopup: true,
  singleExceptions: {
    testKey: null,
  },
  gasLoadingAnimationIsShowing: false,
  smartTransactionsError: null,
  smartTransactionsErrorMessageDismissed: false,
  ledgerWebHidConnectedStatus: WebHIDConnectedStatuses.unknown,
  ledgerTransportStatus: HardwareTransportStates.none,
  newNftAddedMessage: '',
  removeNftMessage: '',
  newNetworkAddedName: '',
  newNetworkAddedConfigurationId: '',
  selectedNetworkConfigurationId: '',
  sendInputCurrencySwitched: false,
  newTokensImported: '',
  onboardedInThisUISession: false,
  customTokenAmount: '',
  scrollToBottom: true,
  txId: null,
  accountDetailsAddress: '',
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  snapsInstallPrivacyWarningShown: false,
  ///: END:ONLY_INCLUDE_IF
};

export default function reduceApp(
  state: AppState,
  action: AnyAction,
): AppState {
  const appState: AppState = {
    ...initialState,
    ...state,
  };

  switch (action.type) {
    // dropdown methods
    case actionConstants.NETWORK_DROPDOWN_OPEN:
      return {
        ...appState,
        networkDropdownOpen: true,
      };

    case actionConstants.NETWORK_DROPDOWN_CLOSE:
      return {
        ...appState,
        networkDropdownOpen: false,
      };

    case actionConstants.IMPORT_NFTS_MODAL_OPEN:
      return {
        ...appState,
        importNftsModal: {
          open: true,
          ...action.payload,
        },
      };

    case actionConstants.IMPORT_NFTS_MODAL_CLOSE:
      return {
        ...appState,
        importNftsModal: {
          open: false,
        },
      };

    case actionConstants.SHOW_IPFS_MODAL_OPEN:
      return {
        ...appState,
        showIpfsModalOpen: true,
      };

    case actionConstants.SHOW_IPFS_MODAL_CLOSE:
      return {
        ...appState,
        showIpfsModalOpen: false,
      };

    case actionConstants.IMPORT_TOKENS_POPOVER_OPEN:
      return {
        ...appState,
        importTokensModalOpen: true,
      };

    case actionConstants.IMPORT_TOKENS_POPOVER_CLOSE:
      return {
        ...appState,
        importTokensModalOpen: false,
      };

    case actionConstants.SELECT_ACTION_MODAL_OPEN:
      return {
        ...appState,
        showSelectActionModal: true,
      };

    case actionConstants.SELECT_ACTION_MODAL_CLOSE:
      return {
        ...appState,
        showSelectActionModal: false,
      };

    // alert methods
    case actionConstants.ALERT_OPEN:
      return {
        ...appState,
        alertOpen: true,
        alertMessage: action.payload,
      };

    case actionConstants.ALERT_CLOSE:
      return {
        ...appState,
        alertOpen: false,
        alertMessage: null,
      };

    case actionConstants.SET_ACCOUNT_DETAILS_ADDRESS: {
      return {
        ...appState,
        accountDetailsAddress: action.payload,
      };
    }

    // qr scanner methods
    case actionConstants.QR_CODE_DETECTED:
      return {
        ...appState,
        qrCodeData: action.value,
      };

    // Smart Transactions errors.
    case actionConstants.SET_SMART_TRANSACTIONS_ERROR:
      return {
        ...appState,
        smartTransactionsError: action.payload,
      };

    case actionConstants.DISMISS_SMART_TRANSACTIONS_ERROR_MESSAGE:
      return {
        ...appState,
        smartTransactionsErrorMessageDismissed: true,
      };

    // modal methods:
    case actionConstants.MODAL_OPEN: {
      const { name, ...modalProps } = action.payload;

      return {
        ...appState,
        modal: {
          open: true,
          modalState: {
            name,
            props: { ...modalProps },
          },
          previousModalState: { ...appState.modal.modalState },
        },
      };
    }

    case actionConstants.MODAL_CLOSE:
      return {
        ...appState,
        modal: Object.assign(
          appState.modal,
          { open: false },
          { modalState: { name: null, props: {} } },
          { previousModalState: appState.modal.modalState },
        ),
      };

    case actionConstants.CLEAR_ACCOUNT_DETAILS:
      return {
        ...appState,
        accountDetail: {
          privateKey: '',
        },
      };
    case actionConstants.SHOW_SEND_TOKEN_PAGE:
      return {
        ...appState,
        warning: null,
      };

    case actionConstants.LOCK_METAMASK:
      return {
        ...appState,
        warning: null,
      };

    // accounts
    case actionConstants.GO_HOME:
      return {
        ...appState,
        accountDetail: {
          privateKey: '',
        },
        warning: null,
      };

    case actionConstants.SHOW_ACCOUNTS_PAGE:
      return {
        ...appState,
        isLoading: false,
        warning: null,
        scrollToBottom: false,
      };

    case actionConstants.SHOW_CONF_TX_PAGE:
      return {
        ...appState,
        txId: action.id,
        warning: null,
        isLoading: false,
      };

    case actionConstants.COMPLETED_TX:
      return {
        ...appState,
        warning: null,
        txId: null,
      };

    case actionConstants.UNLOCK_FAILED:
      return {
        ...appState,
        warning: action.value || 'Incorrect password. Try again.',
      };

    case actionConstants.UNLOCK_SUCCEEDED:
      return {
        ...appState,
        warning: '',
      };

    case actionConstants.SET_HARDWARE_WALLET_DEFAULT_HD_PATH: {
      const { device, path } = action.payload;
      const newDefaults = { ...appState.defaultHdPaths } as any;
      newDefaults[device] = path;

      return {
        ...appState,
        defaultHdPaths: newDefaults,
      };
    }

    case actionConstants.SHOW_LOADING:
      return {
        ...appState,
        isLoading: true,
        loadingMessage: action.payload,
      };

    case actionConstants.HIDE_LOADING:
      return {
        ...appState,
        isLoading: false,
      };

    case actionConstants.DISPLAY_WARNING:
      return {
        ...appState,
        warning: action.payload,
        isLoading: false,
      };

    case actionConstants.HIDE_WARNING:
      return {
        ...appState,
        warning: undefined,
      };

    case actionConstants.SHOW_PRIVATE_KEY:
      return {
        ...appState,
        accountDetail: {
          privateKey: action.payload,
        },
      };

    case actionConstants.SET_SELECTED_NETWORK_CONFIGURATION_ID:
      return {
        ...appState,
        selectedNetworkConfigurationId: action.payload,
      };

    case actionConstants.SET_NEW_NETWORK_ADDED: {
      const { networkConfigurationId, nickname } = action.payload;
      return {
        ...appState,
        newNetworkAddedName: nickname,
        newNetworkAddedConfigurationId: networkConfigurationId,
      };
    }
    case actionConstants.SET_NEW_TOKENS_IMPORTED:
      return {
        ...appState,
        newTokensImported: action.payload,
      };

    case actionConstants.SET_NEW_NFT_ADDED_MESSAGE:
      return {
        ...appState,
        newNftAddedMessage: action.payload,
      };

    case actionConstants.SET_REMOVE_NFT_MESSAGE:
      return {
        ...appState,
        removeNftMessage: action.payload,
      };

    case actionConstants.SET_REQUEST_ACCOUNT_TABS:
      return {
        ...appState,
        requestAccountTabs: action.value,
      };

    case actionConstants.SET_OPEN_METAMASK_TAB_IDS:
      return {
        ...appState,
        openMetaMaskTabs: action.payload,
      };

    case actionConstants.HIDE_WHATS_NEW_POPUP:
      return {
        ...appState,
        showWhatsNewPopup: false,
      };

    case actionConstants.CAPTURE_SINGLE_EXCEPTION:
      return {
        ...appState,
        singleExceptions: {
          ...appState.singleExceptions,
          [action.value]: null,
        },
      };

    case actionConstants.TOGGLE_GAS_LOADING_ANIMATION:
      return {
        ...appState,
        gasLoadingAnimationIsShowing: action.payload,
      };

    case actionConstants.SET_WEBHID_CONNECTED_STATUS:
      return {
        ...appState,
        ledgerWebHidConnectedStatus: action.payload,
      };

    case actionConstants.SET_LEDGER_TRANSPORT_STATUS:
      return {
        ...appState,
        ledgerTransportStatus: action.payload,
      };
    case actionConstants.TOGGLE_CURRENCY_INPUT_SWITCH:
      return {
        ...appState,
        sendInputCurrencySwitched: !appState.sendInputCurrencySwitched,
      };
    case actionConstants.ONBOARDED_IN_THIS_UI_SESSION:
      return {
        ...appState,
        onboardedInThisUISession: action.payload,
      };
    case actionConstants.SET_CUSTOM_TOKEN_AMOUNT:
      return {
        ...appState,
        customTokenAmount: action.payload,
      };
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case actionConstants.SHOW_KEYRING_SNAP_REMOVAL_RESULT:
      return {
        ...appState,
        showKeyringRemovalSnapModal: true,
        keyringRemovalSnapModal: {
          ...action.payload,
        },
      };
    case actionConstants.HIDE_KEYRING_SNAP_REMOVAL_RESULT:
      return {
        ...appState,
        showKeyringRemovalSnapModal: false,
        keyringRemovalSnapModal: {
          snapName: '',
          result: 'none',
        },
      };
    ///: END:ONLY_INCLUDE_IF

    default:
      return appState;
  }
}

// Action Creators
export function hideWhatsNewPopup(): Action {
  return {
    type: actionConstants.HIDE_WHATS_NEW_POPUP,
  };
}

export function toggleGasLoadingAnimation(
  payload: boolean,
): PayloadAction<boolean> {
  return { type: actionConstants.TOGGLE_GAS_LOADING_ANIMATION, payload };
}

export function setLedgerWebHidConnectedStatus(
  payload: WebHIDConnectedStatuses,
): PayloadAction<WebHIDConnectedStatuses> {
  return { type: actionConstants.SET_WEBHID_CONNECTED_STATUS, payload };
}

export function setLedgerTransportStatus(
  payload: HardwareTransportStates,
): PayloadAction<HardwareTransportStates> {
  return { type: actionConstants.SET_LEDGER_TRANSPORT_STATUS, payload };
}

export function toggleCurrencySwitch(): Action {
  return { type: actionConstants.TOGGLE_CURRENCY_INPUT_SWITCH };
}

export function setOnBoardedInThisUISession(
  payload: boolean,
): PayloadAction<boolean> {
  return { type: actionConstants.ONBOARDED_IN_THIS_UI_SESSION, payload };
}

export function setCustomTokenAmount(payload: string): PayloadAction<string> {
  return { type: actionConstants.SET_CUSTOM_TOKEN_AMOUNT, payload };
}

// Selectors
export function getQrCodeData(state: AppSliceState): {
  type?: string | null;
  values?: { address?: string | null };
} | null {
  return state.appState.qrCodeData;
}

export function getGasLoadingAnimationIsShowing(state: AppSliceState): boolean {
  return state.appState.gasLoadingAnimationIsShowing;
}

export function getLedgerWebHidConnectedStatus(
  state: AppSliceState,
): string | null {
  return state.appState.ledgerWebHidConnectedStatus;
}

export function getLedgerTransportStatus(state: AppSliceState): string | null {
  return state.appState.ledgerTransportStatus;
}
