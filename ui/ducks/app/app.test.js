import * as actionConstants from '../../store/actionConstants';
import { HardwareDeviceNames } from '../../../shared/constants/hardware-wallets';
import reduceApp from './app';

const actions = actionConstants;

describe('App State', () => {
  const metamaskState = {};

  it('app init state', () => {
    const initState = reduceApp(metamaskState, {});

    expect.anything(initState);
  });

  it('sets networkDropdownOpen dropdown to true', () => {
    const state = reduceApp(metamaskState, {
      type: actions.NETWORK_DROPDOWN_OPEN,
    });

    expect(state.networkDropdownOpen).toStrictEqual(true);
  });

  it('sets networkDropdownOpen dropdown to false', () => {
    const dropdown = { networkDropdowopen: true };
    const state = { ...metamaskState, ...dropdown };
    const newState = reduceApp(state, {
      type: actions.NETWORK_DROPDOWN_CLOSE,
    });

    expect(newState.networkDropdownOpen).toStrictEqual(false);
  });

  it('opens alert', () => {
    const state = reduceApp(metamaskState, {
      type: actions.ALERT_OPEN,
      payload: 'test message',
    });

    expect(state.alertOpen).toStrictEqual(true);
    expect(state.alertMessage).toStrictEqual('test message');
  });

  it('closes alert', () => {
    const alert = { alertOpen: true, alertMessage: 'test message' };
    const state = { ...metamaskState, ...alert };
    const newState = reduceApp(state, {
      type: actions.ALERT_CLOSE,
    });

    expect(newState.alertOpen).toStrictEqual(false);
    expect(newState.alertMessage).toBeNull();
  });

  it('detects qr code data', () => {
    const state = reduceApp(metamaskState, {
      type: actions.QR_CODE_DETECTED,
      value: 'qr data',
    });

    expect(state.qrCodeData).toStrictEqual('qr data');
  });

  it('opens modal', () => {
    const state = reduceApp(metamaskState, {
      type: actions.MODAL_OPEN,
      payload: {
        name: 'test',
      },
    });

    expect(state.modal.open).toStrictEqual(true);
    expect(state.modal.modalState.name).toStrictEqual('test');
  });

  it('closes modal, but moves open modal state to previous modal state', () => {
    const opensModal = {
      modal: {
        open: true,
        modalState: {
          name: 'test',
        },
      },
    };

    const state = { ...metamaskState, appState: { ...opensModal } };
    const newState = reduceApp(state, {
      type: actions.MODAL_CLOSE,
    });

    expect(newState.modal.open).toStrictEqual(false);
    expect(newState.modal.modalState.name).toBeNull();
  });

  it('shows send token page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_SEND_TOKEN_PAGE,
    });

    expect(state.warning).toBeNull();
  });

  it('locks Metamask', () => {
    const state = reduceApp(metamaskState, {
      type: actions.LOCK_METAMASK,
    });

    expect(state.warning).toBeNull();
  });

  it('goes home', () => {
    const state = reduceApp(metamaskState, {
      type: actions.GO_HOME,
    });

    expect(state.accountDetail.privateKey).toStrictEqual('');
    expect(state.warning).toBeNull();
  });

  it('clears account details', () => {
    const exportPrivKeyModal = {
      accountDetail: {
        privateKey: 'a-priv-key',
      },
    };

    const state = { ...metamaskState, appState: { ...exportPrivKeyModal } };
    const newState = reduceApp(state, {
      type: actions.CLEAR_ACCOUNT_DETAILS,
    });

    expect(newState.accountDetail).toStrictEqual({ privateKey: '' });
  });

  it('shows account page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ACCOUNTS_PAGE,
    });

    expect(state.isLoading).toStrictEqual(false);
    expect(state.warning).toBeNull();
    expect(state.scrollToBottom).toStrictEqual(false);
  });

  it('shows confirm tx page', () => {
    const txs = {
      transactions: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
    };
    const oldState = { ...metamaskState, ...txs };
    const state = reduceApp(oldState, {
      type: actions.SHOW_CONF_TX_PAGE,
      id: 2,
    });

    expect(state.txId).toStrictEqual(2);
    expect(state.warning).toBeNull();
    expect(state.isLoading).toStrictEqual(false);
  });

  it('completes tx continues to show pending txs current view context', () => {
    const txs = {
      transactions: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
    };

    const oldState = { ...metamaskState, ...txs };

    const state = reduceApp(oldState, {
      type: actions.COMPLETED_TX,
      value: {
        id: 1,
      },
    });

    expect(state.txId).toBeNull();
    expect(state.warning).toBeNull();
  });

  it('returns to account detail page when no unconf actions completed tx', () => {
    const state = reduceApp(metamaskState, {
      type: actions.COMPLETED_TX,
      value: {
        unconfirmedActionsCount: 0,
      },
    });

    expect(state.warning).toBeNull();
  });

  it('sets default warning when unlock fails', () => {
    const state = reduceApp(metamaskState, {
      type: actions.UNLOCK_FAILED,
    });

    expect(state.warning).toStrictEqual('Incorrect password. Try again.');
  });

  it('sets errors when unlock fails', () => {
    const state = reduceApp(metamaskState, {
      type: actions.UNLOCK_FAILED,
      value: 'errors',
    });

    expect(state.warning).toStrictEqual('errors');
  });

  it('sets warning to empty string when unlock succeeds', () => {
    const errorState = { warning: 'errors' };
    const oldState = { ...metamaskState, ...errorState };
    const state = reduceApp(oldState, {
      type: actions.UNLOCK_SUCCEEDED,
    });

    expect(state.warning).toStrictEqual('');
  });

  it('sets hardware wallet default hd path', () => {
    const hdPaths = {
      trezor: "m/44'/60'/0'/0",
      ledger: "m/44'/60'/0'",
      lattice: "m/44'/60'/0'/0",
    };
    const state = reduceApp(metamaskState, {
      type: actions.SET_HARDWARE_WALLET_DEFAULT_HD_PATH,
      payload: {
        device: HardwareDeviceNames.ledger,
        path: "m/44'/60'/0'",
      },
    });

    expect(state.defaultHdPaths).toStrictEqual(hdPaths);
  });

  it('shows loading message', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_LOADING,
      payload: 'loading',
    });

    expect(state.isLoading).toStrictEqual(true);
    expect(state.loadingMessage).toStrictEqual('loading');
  });

  it('hides loading message', () => {
    const loadingState = { isLoading: true };
    const oldState = { ...metamaskState, ...loadingState };

    const state = reduceApp(oldState, {
      type: actions.HIDE_LOADING,
    });

    expect(state.isLoading).toStrictEqual(false);
  });

  it('displays warning', () => {
    const state = reduceApp(metamaskState, {
      type: actions.DISPLAY_WARNING,
      payload: 'warning',
    });

    expect(state.isLoading).toStrictEqual(false);
    expect(state.warning).toStrictEqual('warning');
  });

  it('hides warning', () => {
    const displayWarningState = { warning: 'warning' };
    const oldState = { ...metamaskState, ...displayWarningState };
    const state = reduceApp(oldState, {
      type: actions.HIDE_WARNING,
    });

    expect(state.warning).toBeUndefined();
  });

  it('shows private key', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_PRIVATE_KEY,
      payload: 'private key',
    });

    expect(state.accountDetail.privateKey).toStrictEqual('private key');
  });

  it('smart transactions - SET_SMART_TRANSACTIONS_ERROR', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SET_SMART_TRANSACTIONS_ERROR,
      payload: 'Server Side Error',
    });
    expect(state.smartTransactionsError).toStrictEqual('Server Side Error');
  });
  it('shows delete metametrics modal', () => {
    const state = reduceApp(metamaskState, {
      type: actions.DELETE_METAMETRICS_DATA_MODAL_OPEN,
    });

    expect(state.showDeleteMetaMetricsDataModal).toStrictEqual(true);
  });
  it('hides delete metametrics modal', () => {
    const deleteMetaMetricsDataModalState = {
      showDeleteMetaMetricsDataModal: true,
    };
    const oldState = { ...metamaskState, ...deleteMetaMetricsDataModalState };

    const state = reduceApp(oldState, {
      type: actions.DELETE_METAMETRICS_DATA_MODAL_CLOSE,
    });

    expect(state.showDeleteMetaMetricsDataModal).toStrictEqual(false);
  });
  it('shows delete metametrics error modal', () => {
    const state = reduceApp(metamaskState, {
      type: actions.DATA_DELETION_ERROR_MODAL_OPEN,
    });

    expect(state.showDataDeletionErrorModal).toStrictEqual(true);
  });
  it('hides delete metametrics error modal', () => {
    const deleteMetaMetricsErrorModalState = {
      showDataDeletionErrorModal: true,
    };
    const oldState = { ...metamaskState, ...deleteMetaMetricsErrorModalState };

    const state = reduceApp(oldState, {
      type: actions.DATA_DELETION_ERROR_MODAL_CLOSE,
    });

    expect(state.showDataDeletionErrorModal).toStrictEqual(false);
  });

  it('displays error in settings', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_SETTINGS_PAGE_ERROR,
      payload: 'settings page error',
    });

    expect(state.errorInSettings).toStrictEqual('settings page error');
  });

  it('hides error in settings', () => {
    const displayErrorInSettings = { errorInSettings: 'settings page error' };
    const oldState = { ...metamaskState, ...displayErrorInSettings };
    const state = reduceApp(oldState, {
      type: actions.HIDE_SETTINGS_PAGE_ERROR,
    });

    expect(state.errorInSettings).toBeNull();
  });

  it('toggles account menu', () => {
    const state = reduceApp(
      {},
      {
        type: actionConstants.TOGGLE_ACCOUNT_MENU,
      },
    );

    expect(state.isAccountMenuOpen).toStrictEqual(true);
  });

  it('toggles network menu', () => {
    const state = reduceApp(
      {},
      {
        type: actionConstants.TOGGLE_NETWORK_MENU,
      },
    );

    expect(state.isNetworkMenuOpen).toStrictEqual(true);
  });

  it('close welcome screen', () => {
    const state = reduceApp(
      {},
      {
        type: actionConstants.CLOSE_WELCOME_SCREEN,
      },
    );

    expect(state.welcomeScreenSeen).toStrictEqual(true);
  });

  it('sets pending tokens', () => {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const pendingTokensState = reduceApp(
      {},
      {
        type: actionConstants.SET_PENDING_TOKENS,
        payload,
      },
    );

    expect(pendingTokensState.pendingTokens).toStrictEqual(payload);
  });

  it('clears pending tokens', () => {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const pendingTokensState = {
      pendingTokens: payload,
    };

    const state = reduceApp(pendingTokensState, {
      type: actionConstants.CLEAR_PENDING_TOKENS,
    });

    expect(state.pendingTokens).toStrictEqual({});
  });
});
