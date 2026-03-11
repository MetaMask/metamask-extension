import { act, fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { useNavigate } from 'react-router-dom';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  LedgerTransportTypes,
  HardwareDeviceNames,
} from '../../../../shared/constants/hardware-wallets';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import ConnectHardwareForm from '.';

const mockConnectHardware = jest.fn();
const mockCheckHardwareStatus = jest.fn().mockResolvedValue(false);

jest.mock('../../../store/actions', () => ({
  connectHardware: () => mockConnectHardware,
  checkHardwareStatus: () => mockCheckHardwareStatus,
}));

const mockGetActiveQrCodeScanRequest = jest.fn().mockReturnValue(null);

jest.mock('../../../selectors', () => ({
  getCurrentChainId: () => '0x1',
  getSelectedAddress: () => '0xselectedAddress',
  getRpcPrefsForCurrentProvider: () => {
    return {};
  },
  getMetaMaskAccountsConnected: () => [],
  getMetaMaskAccounts: () => {
    return {};
  },
  getActiveQrCodeScanRequest: (...args: unknown[]) =>
    mockGetActiveQrCodeScanRequest(...args),
}));

jest.mock('../../../selectors/multi-srp/multi-srp', () => ({
  getShouldShowSeedPhraseReminder: () => false,
}));

jest.mock('../../../ducks/bridge/selectors', () => ({
  getAllBridgeableNetworks: () => [],
}));

const MOCK_RECENT_PAGE = '/home';
jest.mock('../../../ducks/history/history', () => ({
  getMostRecentOverviewPage: jest
    .fn()
    .mockImplementation(() => MOCK_RECENT_PAGE),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({ pathname: '/test' }),
  useParams: () => ({}),
}));

const mockTrackEvent = jest.fn();

const mockProps = {
  forgetDevice: () => jest.fn(),
  showAlert: () => jest.fn(),
  hideAlert: () => jest.fn(),
  unlockHardwareWalletAccount: () => jest.fn(),
  setHardwareWalletDefaultHdPath: () => jest.fn(),
  connectHardware: () => mockConnectHardware,
  defaultHdPath: "m/44'/60'/0'/0",
  mostRecentOverviewPage: MOCK_RECENT_PAGE,
  trackEvent: () => mockTrackEvent,
};

const mockState = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    internalAccounts: {
      accounts: {
        accountId: {
          address: '0x0000000000000000000000000000000000000000',
          metadata: {
            keyring: 'HD Key Tree',
          },
        },
      },
      selectedAccount: 'accountId',
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0000000000000000000000000000000000000000'],
      },
    ],
  },
  appState: {
    networkDropdownOpen: false,
    gasIsLoading: false,
    isLoading: false,
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
    warning: null,
    chainId: '0x1',
    rpcPrefs: null,
    accounts: [],
    connectedAccounts: [],
    defaultHdPaths: {
      [HardwareDeviceNames.lattice]: "m/44'/60'/0'/0",
      [HardwareDeviceNames.ledger]: "m/44'/60'/0'/0",
      [HardwareDeviceNames.oneKey]: "m/44'/60'/0'/0",
      [HardwareDeviceNames.trezor]: "m/44'/60'/0'/0",
    },
    mostRecentOverviewPage: '',
    ledgerTransportType: LedgerTransportTypes.webhid,
  },
};

describe('ConnectHardwareForm', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matchs snapshot', () => {
    const { container } = renderWithProvider(
      <ConnectHardwareForm {...mockProps} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('verifies mocks are working', () => {
    // Test that our mock is working
    const navigate = useNavigate();
    navigate('/test');
    expect(mockUseNavigate).toHaveBeenCalledWith('/test');
  });

  it('closes the form when close button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ConnectHardwareForm {...mockProps} />,
      mockStore,
    );

    const closeButton = getByTestId('hardware-connect-close-btn');

    fireEvent.click(closeButton);

    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith(MOCK_RECENT_PAGE);
  });

  describe('U2F Error', () => {
    it('renders a U2F error', async () => {
      mockConnectHardware.mockRejectedValue(new Error('U2F Error'));
      const mockStateWithU2F = Object.assign(mockState, {});
      mockStateWithU2F.appState.ledgerTransportType = LedgerTransportTypes.u2f;
      const mockStoreWithU2F = configureMockStore([thunk])(mockStateWithU2F);
      const { getByText, getByLabelText, queryByText } = renderWithProvider(
        <ConnectHardwareForm {...mockProps} />,
        mockStoreWithU2F,
      );

      const ledgerButton = getByLabelText(messages.ledger.message);
      const continueButton = getByText(messages.continue.message);

      fireEvent.click(ledgerButton);
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(
          getByText('We had trouble connecting to your ledger, try reviewing', {
            exact: false,
          }),
        ).toBeInTheDocument();
        const firefoxError = queryByText(
          "If you're on the latest version of Firefox, you might be experiencing an issue related to Firefox dropping U2F support. Learn how to fix this issue",
          { exact: false },
        );
        expect(firefoxError).not.toBeInTheDocument();
      });
    });

    it('renders a different U2F error for firefox', async () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
        );

      mockConnectHardware.mockRejectedValue(new Error('U2F Error'));
      const mockStateWithU2F = Object.assign(mockState, {});
      mockStateWithU2F.appState.ledgerTransportType = LedgerTransportTypes.u2f;
      const mockStoreWithU2F = configureMockStore([thunk])(mockStateWithU2F);
      const { getByText, getByLabelText } = renderWithProvider(
        <ConnectHardwareForm {...mockProps} />,
        mockStoreWithU2F,
      );

      const ledgerButton = getByLabelText(messages.ledger.message);
      const continueButton = getByText(messages.continue.message);

      fireEvent.click(ledgerButton);
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(
          getByText(
            "If you're on the latest version of Firefox, you might be experiencing an issue related to Firefox dropping U2F support. Learn how to fix this issue",
            { exact: false },
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe('QR Hardware Wallet Steps', () => {
    it('renders the QR hardware wallet steps', async () => {
      const { getByText, getByLabelText } = renderWithProvider(
        <ConnectHardwareForm {...mockProps} />,
        mockStore,
      );

      const qrButton = getByLabelText('QRCode');

      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(getByText(messages.keystone.message)).toBeInTheDocument();
        expect(getByText(messages.airgapVault.message)).toBeInTheDocument();
        expect(getByText(messages.coolWallet.message)).toBeInTheDocument();
        expect(getByText(messages.dcent.message)).toBeInTheDocument();
        expect(getByText(messages.imToken.message)).toBeInTheDocument();
        expect(
          getByText(messages.QRHardwareWalletSteps2Description.message),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Select Hardware', () => {
    it('checks link buttons for Ngrave Zero brand', async () => {
      window.open = jest.fn();

      const { getByLabelText, getByTestId } = renderWithProvider(
        <ConnectHardwareForm {...mockProps} />,
        mockStore,
      );

      const qrButton = getByLabelText('QRCode');

      fireEvent.click(qrButton);

      const buyNowButton = getByTestId('ngrave-brand-buy-now-btn');
      expect(buyNowButton).toBeInTheDocument();
      fireEvent.click(buyNowButton);
      expect(window.open).toHaveBeenCalled();

      const learnMoreButton = getByTestId('ngrave-brand-learn-more-btn');
      expect(learnMoreButton).toBeInTheDocument();
      fireEvent.click(learnMoreButton);
      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('getPage method', () => {
    beforeEach(() => {
      mockConnectHardware.mockReset();
    });

    it('calls connectHardware with loadHid=true', async () => {
      mockConnectHardware.mockReset();

      const mockAccounts = [
        { address: '0xAddress1', balance: null, index: 0 },
        { address: '0xAddress2', balance: null, index: 1 },
      ];
      mockConnectHardware.mockResolvedValue(mockAccounts);

      renderWithProvider(<ConnectHardwareForm {...mockProps} />, mockStore);

      const hdPath = "m/44'/60'/0'/0";
      const deviceName = 'ledger';
      const pageIndex = 0;
      const loadHidValue = true;

      await mockConnectHardware(
        deviceName,
        pageIndex,
        hdPath,
        loadHidValue,
        jest.fn(),
      );

      expect(mockConnectHardware).toHaveBeenCalledWith(
        deviceName,
        pageIndex,
        hdPath,
        loadHidValue,
        expect.any(Function),
      );
    });

    it('calls connectHardware with loadHid=false', async () => {
      mockConnectHardware.mockReset();

      const mockAccounts = [
        { address: '0xAddress1', balance: null, index: 0 },
        { address: '0xAddress2', balance: null, index: 1 },
      ];
      mockConnectHardware.mockResolvedValue(mockAccounts);

      renderWithProvider(<ConnectHardwareForm {...mockProps} />, mockStore);

      const hdPath = "m/44'/60'/0'/0";
      const deviceName = 'ledger';
      const pageIndex = 0;
      const loadHidValue = false;

      await mockConnectHardware(
        deviceName,
        pageIndex,
        hdPath,
        loadHidValue,
        jest.fn(),
      );

      expect(mockConnectHardware).toHaveBeenCalledWith(
        deviceName,
        pageIndex,
        hdPath,
        loadHidValue,
        expect.any(Function),
      );
    });

    it('handles errors when connectHardware fails', async () => {
      const testError = new Error('Test Error');
      mockConnectHardware.mockReset();
      mockConnectHardware.mockRejectedValue(testError);

      renderWithProvider(<ConnectHardwareForm {...mockProps} />, mockStore);

      await expect(mockConnectHardware()).rejects.toThrow('Test Error');
    });

    describe('Ledger error handling (toHardwareWalletError)', () => {
      it('displays SDK userMessage when Ledger error has a mapped status code (e.g. 0x6a83 wrong app)', async () => {
        mockConnectHardware.mockRejectedValue(
          new Error('Ledger device: UNKNOWN_ERROR (0x6a83)'),
        );

        const { getByText, getByLabelText } = renderWithProvider(
          <ConnectHardwareForm {...mockProps} />,
          mockStore,
        );

        fireEvent.click(getByLabelText(messages.ledger.message));
        fireEvent.click(getByText(messages.continue.message));

        await waitFor(() => {
          expect(
            getByText('Ethereum app is closed. Please open it to continue.'),
          ).toBeInTheDocument();
        });
      });

      it('displays original error message when Ledger error maps to Unknown or ConnectionClosed (e.g. no app open)', async () => {
        const appClosedMessage = 'Ledger: App closed or connection issue';
        mockConnectHardware.mockRejectedValue(new Error(appClosedMessage));

        const { getByText, getByLabelText } = renderWithProvider(
          <ConnectHardwareForm {...mockProps} />,
          mockStore,
        );

        fireEvent.click(getByLabelText(messages.ledger.message));
        fireEvent.click(getByText(messages.continue.message));

        await waitFor(() => {
          expect(getByText(appClosedMessage)).toBeInTheDocument();
        });
      });
    });
  });

  describe('componentDidUpdate - QR scan completion', () => {
    beforeEach(() => {
      mockCheckHardwareStatus.mockReset().mockResolvedValue(false);
      mockConnectHardware.mockReset();
      mockGetActiveQrCodeScanRequest.mockReturnValue(null);
    });

    const mockStateWithQrPath = {
      ...mockState,
      appState: {
        ...mockState.appState,
        defaultHdPaths: {
          ...mockState.appState.defaultHdPaths,
          [HardwareDeviceNames.qr]: "m/44'/60'/0'",
        },
      },
    };

    function createStoreWithFreshRefs() {
      const store = configureMockStore([thunk])(mockStateWithQrPath);
      const origGetState = store.getState.bind(store);
      store.getState = () => ({
        ...(origGetState() as Record<string, unknown>),
      });
      return store;
    }

    async function renderAndWaitForMount(
      store: ReturnType<typeof createStoreWithFreshRefs>,
    ) {
      const result = renderWithProvider(
        <ConnectHardwareForm {...mockProps} />,
        store,
      );
      await waitFor(() =>
        expect(mockCheckHardwareStatus).toHaveBeenCalledTimes(4),
      );
      return result;
    }

    async function simulateScanCompletion(
      store: ReturnType<typeof createStoreWithFreshRefs>,
    ) {
      mockGetActiveQrCodeScanRequest.mockReturnValue(null);
      await act(async () => {
        store.dispatch({ type: 'FORCE_UPDATE' });
      });
    }

    it('fetches accounts when QR PAIR scan completes and keyring is unlocked', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.PAIR,
      });

      const store = createStoreWithFreshRefs();
      await renderAndWaitForMount(store);

      mockCheckHardwareStatus.mockReset().mockResolvedValue(true);
      mockConnectHardware
        .mockReset()
        .mockResolvedValue([{ address: '0xQR1', balance: null, index: 0 }]);

      await simulateScanCompletion(store);

      await waitFor(() => {
        expect(mockCheckHardwareStatus).toHaveBeenCalled();
        expect(mockConnectHardware).toHaveBeenCalled();
      });
    });

    it('does not fetch accounts when keyring is locked', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.PAIR,
      });

      const store = createStoreWithFreshRefs();
      await renderAndWaitForMount(store);

      mockCheckHardwareStatus.mockReset().mockResolvedValue(false);
      mockConnectHardware.mockReset();

      await simulateScanCompletion(store);

      await waitFor(() => {
        expect(mockCheckHardwareStatus).toHaveBeenCalled();
      });
      expect(mockConnectHardware).not.toHaveBeenCalled();
    });

    it('sets error state when checkHardwareStatus rejects with Error object', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.PAIR,
      });

      const store = createStoreWithFreshRefs();
      const { getByText } = await renderAndWaitForMount(store);

      mockCheckHardwareStatus
        .mockReset()
        .mockRejectedValue(new Error('hardware error'));

      await simulateScanCompletion(store);

      await waitFor(() => {
        expect(getByText('hardware error')).toBeInTheDocument();
      });
    });

    it('sets error state when checkHardwareStatus rejects with string', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.PAIR,
      });

      const store = createStoreWithFreshRefs();
      const { getByText } = await renderAndWaitForMount(store);

      mockCheckHardwareStatus.mockReset().mockRejectedValue('string error');

      await simulateScanCompletion(store);

      await waitFor(() => {
        expect(getByText('string error')).toBeInTheDocument();
      });
    });

    it('does not trigger when previous scan was not PAIR type', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.SIGN,
      });

      const store = createStoreWithFreshRefs();
      await renderAndWaitForMount(store);

      mockCheckHardwareStatus.mockReset();

      await simulateScanCompletion(store);

      expect(mockCheckHardwareStatus).not.toHaveBeenCalled();
    });

    it('works when defaultHdPaths has no QR entry', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.PAIR,
      });

      const storeWithoutQrPath = configureMockStore([thunk])({
        ...mockState,
        appState: {
          ...mockState.appState,
        },
      });
      const origGetState = storeWithoutQrPath.getState.bind(storeWithoutQrPath);
      storeWithoutQrPath.getState = () => ({
        ...(origGetState() as Record<string, unknown>),
      });

      renderWithProvider(
        <ConnectHardwareForm {...mockProps} />,
        storeWithoutQrPath,
      );
      await waitFor(() =>
        expect(mockCheckHardwareStatus).toHaveBeenCalledTimes(4),
      );

      mockCheckHardwareStatus.mockReset().mockResolvedValue(true);
      mockConnectHardware
        .mockReset()
        .mockResolvedValue([{ address: '0xQR1', balance: null, index: 0 }]);

      mockGetActiveQrCodeScanRequest.mockReturnValue(null);
      await act(async () => {
        storeWithoutQrPath.dispatch({ type: 'FORCE_UPDATE' });
      });

      await waitFor(() => {
        expect(mockCheckHardwareStatus).toHaveBeenCalled();
        expect(mockConnectHardware).toHaveBeenCalled();
      });
    });

    it('does not overwrite device when user selects another device while checkHardwareStatus is pending', async () => {
      mockGetActiveQrCodeScanRequest.mockReturnValue({
        type: QrScanRequestType.PAIR,
      });

      const store = createStoreWithFreshRefs();
      const { getByLabelText, getByText } = await renderAndWaitForMount(store);

      let resolveStatus: (value: boolean) => void;
      const deferredStatus = new Promise<boolean>((resolve) => {
        resolveStatus = resolve;
      });
      mockCheckHardwareStatus.mockReset().mockReturnValue(deferredStatus);
      mockConnectHardware
        .mockReset()
        .mockResolvedValue([{ address: '0xLedger1', balance: null, index: 0 }]);

      await simulateScanCompletion(store);

      const ledgerButton = getByLabelText(messages.ledger.message);
      const continueButton = getByText(messages.continue.message);
      fireEvent.click(ledgerButton);
      fireEvent.click(continueButton);

      await act(async () => {
        resolveStatus!(true);
      });

      await waitFor(() => {
        const qrCalls = mockConnectHardware.mock.calls.filter(
          (call: unknown[]) => call[0] === HardwareDeviceNames.qr,
        );
        expect(qrCalls).toHaveLength(0);
      });
    });
  });
});
