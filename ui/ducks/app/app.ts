import type {
  ContractExchangeRates,
  Token,
} from '@metamask/assets-controllers';
import { AnyAction, Action } from 'redux';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  WebHIDConnectedStatuses,
  HardwareTransportStates,
} from '../../../shared/constants/hardware-wallets';
import * as actionConstants from '../../store/actionConstants';

type AppState = {
  customNonceValue: string;
  isAccountMenuOpen: boolean;
  isNetworkMenuOpen: boolean;
  nextNonce: string | null;
  pendingTokens: {
    [address: string]: Token & { isCustom?: boolean; unlisted?: boolean };
  };
  welcomeScreenSeen: boolean;
  confirmationExchangeRates: ContractExchangeRates;
  shouldClose: boolean;
  menuOpen: boolean;
  modal: {
    open: boolean;
    modalState: {
      name: string | null;
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  showPermittedNetworkToastOpen: boolean;
  showIpfsModalOpen: boolean;
  keyringRemovalSnapModal: {
    snapName: string;
    result: 'success' | 'failure' | 'none';
  };
  showKeyringRemovalSnapModal: boolean;
  importTokensModalOpen: boolean;
  deprecatedNetworkModalOpen: boolean;
  accountDetail: {
    subview?: string;
    accountExport?: string;
    privateKey?: string;
  };
  isLoading: boolean;
  isNftStillFetchingIndication: boolean;
  showNftDetectionEnablementToast: boolean;
  loadingMessage: string | null;
  scrollToBottom: boolean;
  warning: string | null | undefined;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buyView: Record<string, any>;
  defaultHdPaths: {
    trezor: string;
    onekey: string;
    ledger: string;
    lattice: string;
  };
  networksTabSelectedRpcUrl: string | null;
  requestAccountTabs: Record<string, number>; // [url.origin]: tab.id
  openMetaMaskTabs: Record<string, boolean>; // openMetamaskTabsIDs[tab.id]): true/false
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  showBasicFunctionalityModal: boolean;
  externalServicesOnboardingToggleState: boolean;
  newNftAddedMessage: string;
  removeNftMessage: string;
  newNetworkAddedName: string;
  editedNetwork:
    | {
        chainId: string;
        nickname?: string;
        editCompleted?: boolean;
        newNetwork?: boolean;
      }
    | undefined;
  newNetworkAddedConfigurationId: string;
  selectedNetworkConfigurationId: string;
  sendInputCurrencySwitched: boolean;
  newTokensImported: string;
  newTokensImportedError: string;
  onboardedInThisUISession: boolean;
  customTokenAmount: string;
  txId: string | null;
  accountDetailsAddress: string;
  showDeleteMetaMetricsDataModal: boolean;
  showDataDeletionErrorModal: boolean;
  snapsInstallPrivacyWarningShown: boolean;
  isAddingNewNetwork: boolean;
  isMultiRpcOnboarding: boolean;
  errorInSettings: string | null;
};

export type AppSliceState = {
  appState: AppState;
};

// default state
const initialState: AppState = {
  customNonceValue: '',
  isAccountMenuOpen: false,
  isNetworkMenuOpen: false,
  nextNonce: null,
  pendingTokens: {},
  welcomeScreenSeen: false,
  confirmationExchangeRates: {},
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
  showPermittedNetworkToastOpen: false,
  showIpfsModalOpen: false,
  showBasicFunctionalityModal: false,
  externalServicesOnboardingToggleState: true,
  keyringRemovalSnapModal: {
    snapName: '',
    result: 'none',
  },
  showKeyringRemovalSnapModal: false,
  importTokensModalOpen: false,
  deprecatedNetworkModalOpen: false,
  accountDetail: {
    privateKey: '',
  },
  // Used to display loading indicator
  isLoading: false,
  // Used to show a spinner at the bottom of the page when we are still fetching nfts
  isNftStillFetchingIndication: false,
  // Used to display a toast after the user enables the nft auto detection from the notice banner
  showNftDetectionEnablementToast: false,
  loadingMessage: null,
  // Used to display error text
  warning: null,
  buyView: {},
  defaultHdPaths: {
    trezor: `m/44'/60'/0'/0`,
    onekey: `m/44'/60'/0'/0`,
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
  editedNetwork: undefined,
  newNetworkAddedConfigurationId: '',
  selectedNetworkConfigurationId: '',
  sendInputCurrencySwitched: false,
  newTokensImported: '',
  newTokensImportedError: '',
  onboardedInThisUISession: false,
  customTokenAmount: '',
  scrollToBottom: true,
  txId: null,
  accountDetailsAddress: '',
  showDeleteMetaMetricsDataModal: false,
  showDataDeletionErrorModal: false,
  snapsInstallPrivacyWarningShown: false,
  isAddingNewNetwork: false,
  isMultiRpcOnboarding: false,
  errorInSettings: null,
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
    case actionConstants.UPDATE_CUSTOM_NONCE:
      return {
        ...appState,
        customNonceValue: action.value,
      };

    case actionConstants.TOGGLE_ACCOUNT_MENU:
      return {
        ...appState,
        isAccountMenuOpen: !appState.isAccountMenuOpen,
      };

    case actionConstants.SET_NEXT_NONCE: {
      return {
        ...appState,
        nextNonce: action.payload,
      };
    }

    case actionConstants.SET_PENDING_TOKENS:
      return {
        ...appState,
        pendingTokens: { ...action.payload },
      };

    case actionConstants.CLEAR_PENDING_TOKENS: {
      return {
        ...appState,
        pendingTokens: {},
      };
    }

    case actionConstants.CLOSE_WELCOME_SCREEN:
      return {
        ...appState,
        welcomeScreenSeen: true,
      };

    case actionConstants.SET_CONFIRMATION_EXCHANGE_RATES:
      return {
        ...appState,
        confirmationExchangeRates: action.value,
      };

    case actionConstants.RESET_ONBOARDING: {
      return {
        ...appState,
        welcomeScreenSeen: false,
      };
    }

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

    case actionConstants.SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN:
      return {
        ...appState,
        showBasicFunctionalityModal: true,
      };

    case actionConstants.SHOW_BASIC_FUNCTIONALITY_MODAL_CLOSE:
      return {
        ...appState,
        showBasicFunctionalityModal: false,
      };

    case actionConstants.ONBOARDING_TOGGLE_BASIC_FUNCTIONALITY_ON:
      return {
        ...appState,
        externalServicesOnboardingToggleState: true,
      };
    case actionConstants.ONBOARDING_TOGGLE_BASIC_FUNCTIONALITY_OFF:
      return {
        ...appState,
        externalServicesOnboardingToggleState: false,
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

    case actionConstants.SHOW_PERMITTED_NETWORK_TOAST_OPEN:
      return {
        ...appState,
        showPermittedNetworkToastOpen: true,
      };

    case actionConstants.SHOW_PERMITTED_NETWORK_TOAST_CLOSE:
      return {
        ...appState,
        showPermittedNetworkToastOpen: false,
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

    case actionConstants.DEPRECATED_NETWORK_POPOVER_OPEN:
      return {
        ...appState,
        deprecatedNetworkModalOpen: true,
      };

    case actionConstants.DEPRECATED_NETWORK_POPOVER_CLOSE:
      return {
        ...appState,
        deprecatedNetworkModalOpen: false,
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
        modal: {
          ...appState.modal,
          open: false,
          modalState: { name: null, props: {} },
          previousModalState: { ...appState.modal.modalState },
        },
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
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    case actionConstants.SHOW_NFT_STILL_FETCHING_INDICATION:
      return {
        ...appState,
        isNftStillFetchingIndication: true,
      };
    case actionConstants.SHOW_NFT_DETECTION_ENABLEMENT_TOAST:
      return {
        ...appState,
        showNftDetectionEnablementToast: action.payload,
      };

    case actionConstants.HIDE_NFT_STILL_FETCHING_INDICATION:
      return {
        ...appState,
        isNftStillFetchingIndication: false,
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
    case actionConstants.SET_EDIT_NETWORK: {
      return {
        ...appState,
        editedNetwork: action.payload,
      };
    }
    case actionConstants.SET_NEW_TOKENS_IMPORTED:
      return {
        ...appState,
        newTokensImported: action.payload,
      };

    case actionConstants.SET_NEW_TOKENS_IMPORTED_ERROR:
      return {
        ...appState,
        newTokensImportedError: action.payload,
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
    case actionConstants.TOGGLE_NETWORK_MENU:
      return {
        ...appState,
        isAddingNewNetwork: Boolean(action.payload?.isAddingNewNetwork),
        isMultiRpcOnboarding: Boolean(action.payload?.isMultiRpcOnboarding),
        isNetworkMenuOpen: !appState.isNetworkMenuOpen,
      };
    case actionConstants.DELETE_METAMETRICS_DATA_MODAL_OPEN:
      return {
        ...appState,
        showDeleteMetaMetricsDataModal: true,
      };
    case actionConstants.DELETE_METAMETRICS_DATA_MODAL_CLOSE:
      return {
        ...appState,
        showDeleteMetaMetricsDataModal: false,
      };
    case actionConstants.DATA_DELETION_ERROR_MODAL_OPEN:
      return {
        ...appState,
        showDataDeletionErrorModal: true,
      };
    case actionConstants.DATA_DELETION_ERROR_MODAL_CLOSE:
      return {
        ...appState,
        showDataDeletionErrorModal: false,
      };
    case actionConstants.SHOW_SETTINGS_PAGE_ERROR:
      return {
        ...appState,
        errorInSettings: action.payload,
      };
    case actionConstants.HIDE_SETTINGS_PAGE_ERROR:
      return {
        ...appState,
        errorInSettings: null,
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

export function openBasicFunctionalityModal(): Action {
  return {
    type: actionConstants.SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN,
  };
}

export function hideBasicFunctionalityModal(): Action {
  return {
    type: actionConstants.SHOW_BASIC_FUNCTIONALITY_MODAL_CLOSE,
  };
}

export function onboardingToggleBasicFunctionalityOn(): Action {
  return {
    type: actionConstants.ONBOARDING_TOGGLE_BASIC_FUNCTIONALITY_ON,
  };
}

export function onboardingToggleBasicFunctionalityOff(): Action {
  return {
    type: actionConstants.ONBOARDING_TOGGLE_BASIC_FUNCTIONALITY_OFF,
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

/**
 * An action creator for display a error to the user in various places in the
 * UI. It will not be cleared until a new warning replaces it or `hideWarning`
 * is called.
 *
 * @param payload - The warning to show.
 * @returns The action to display the warning.
 */
export function displayErrorInSettings(payload: string): PayloadAction<string> {
  return {
    type: actionConstants.SHOW_SETTINGS_PAGE_ERROR,
    payload,
  };
}

export function hideErrorInSettings() {
  return {
    type: actionConstants.HIDE_SETTINGS_PAGE_ERROR,
  };
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

export function openDeleteMetaMetricsDataModal(): Action {
  return {
    type: actionConstants.DELETE_METAMETRICS_DATA_MODAL_OPEN,
  };
}

export function hideDeleteMetaMetricsDataModal(): Action {
  return {
    type: actionConstants.DELETE_METAMETRICS_DATA_MODAL_CLOSE,
  };
}

export function openDataDeletionErrorModal(): Action {
  return {
    type: actionConstants.DATA_DELETION_ERROR_MODAL_OPEN,
  };
}

export function hideDataDeletionErrorModal(): Action {
  return {
    type: actionConstants.DATA_DELETION_ERROR_MODAL_CLOSE,
  };
}
