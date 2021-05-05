import * as actionConstants from '../../store/actionConstants';
import reduceApp from './app';

const actions = actionConstants;

describe('App State', () => {
  const metamaskState = {
    selectedAddress: '0xAddress',
    identities: {
      '0xAddress': {
        name: 'account 1',
        address: '0xAddress',
      },
    },
  };

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

  it('opens sidebar', () => {
    const value = {
      transitionName: 'sidebar-right',
      type: 'wallet-view',
      isOpen: true,
    };
    const state = reduceApp(metamaskState, {
      type: actions.SIDEBAR_OPEN,
      value,
    });

    expect(state.sidebar).toStrictEqual(value);
  });

  it('closes sidebar', () => {
    const openSidebar = { sidebar: { isOpen: true } };
    const state = { ...metamaskState, ...openSidebar };

    const newState = reduceApp(state, {
      type: actions.SIDEBAR_CLOSE,
    });

    expect(newState.sidebar.isOpen).toStrictEqual(false);
  });

  it('opens alert', () => {
    const state = reduceApp(metamaskState, {
      type: actions.ALERT_OPEN,
      value: 'test message',
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

    expect(state.accountDetail.subview).toStrictEqual('transactions');
    expect(state.accountDetail.accountExport).toStrictEqual('none');
    expect(state.accountDetail.privateKey).toStrictEqual('');
    expect(state.warning).toBeNull();
  });

  it('shows account detail', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ACCOUNT_DETAIL,
      value: 'context address',
    });
    expect(state.forgottenPassword).toBeNull(); // default
    expect(state.accountDetail.subview).toStrictEqual('transactions'); // default
    expect(state.accountDetail.accountExport).toStrictEqual('none'); // default
    expect(state.accountDetail.privateKey).toStrictEqual(''); // default
  });

  it('clears account details', () => {
    const exportPrivKeyModal = {
      accountDetail: {
        subview: 'export',
        accountExport: 'completed',
        privateKey: 'a-priv-key',
      },
    };

    const state = { ...metamaskState, appState: { ...exportPrivKeyModal } };
    const newState = reduceApp(state, {
      type: actions.CLEAR_ACCOUNT_DETAILS,
    });

    expect(newState.accountDetail).toStrictEqual({});
  });

  it('shoes account page', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_ACCOUNTS_PAGE,
    });

    expect(state.isLoading).toStrictEqual(false);
    expect(state.warning).toBeNull();
    expect(state.scrollToBottom).toStrictEqual(false);
    expect(state.forgottenPassword).toStrictEqual(false);
  });

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
      unapprovedTxs: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
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
    expect(state.accountDetail.subview).toStrictEqual('transactions');
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
    };
    const state = reduceApp(metamaskState, {
      type: actions.SET_HARDWARE_WALLET_DEFAULT_HD_PATH,
      value: {
        device: 'ledger',
        path: "m/44'/60'/0'",
      },
    });

    expect(state.defaultHdPaths).toStrictEqual(hdPaths);
  });

  it('shows loading message', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SHOW_LOADING,
      value: 'loading',
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
      value: 'warning',
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
      value: 'private key',
    });

    expect(state.accountDetail.subview).toStrictEqual('export');
    expect(state.accountDetail.accountExport).toStrictEqual('completed');
    expect(state.accountDetail.privateKey).toStrictEqual('private key');
  });

  it('set mouse user state', () => {
    const state = reduceApp(metamaskState, {
      type: actions.SET_MOUSE_USER_STATE,
      value: true,
    });

    expect(state.isMouseUser).toStrictEqual(true);
  });

  it('sets gas loading', () => {
    const state = reduceApp(metamaskState, {
      type: actions.GAS_LOADING_STARTED,
    });

    expect(state.gasIsLoading).toStrictEqual(true);
  });

  it('unsets gas loading', () => {
    const gasLoadingState = { gasIsLoading: true };
    const oldState = { ...metamaskState, ...gasLoadingState };
    const state = reduceApp(oldState, {
      type: actions.GAS_LOADING_FINISHED,
    });

    expect(state.gasIsLoading).toStrictEqual(false);
  });
});
