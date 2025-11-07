import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { useNavigate } from 'react-router-dom-v5-compat';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
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

// Mock React Router v5-compat hooks that withRouterHooks uses
const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
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

      const ledgerButton = getByLabelText('Ledger');
      const continueButton = getByText('Continue');

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

      const ledgerButton = getByLabelText('Ledger');
      const continueButton = getByText('Continue');

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
        expect(getByText('Keystone')).toBeInTheDocument();
        expect(getByText('AirGap Vault')).toBeInTheDocument();
        expect(getByText('CoolWallet')).toBeInTheDocument();
        expect(getByText("D'Cent")).toBeInTheDocument();
        expect(getByText('imToken')).toBeInTheDocument();
        expect(getByText('Ngrave Zero')).toBeInTheDocument();
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
  });
});
