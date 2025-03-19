import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  LedgerTransportTypes,
  HardwareDeviceNames,
} from '../../../../shared/constants/hardware-wallets';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import ConnectHardwareForm from '.';

const mockConnectHardware = jest.fn();
const mockCheckHardwareStatus = jest.fn().mockResolvedValue(false);
const mockGetgetDeviceNameForMetric = jest.fn().mockResolvedValue('ledger');

jest.mock('../../../store/actions', () => ({
  connectHardware: () => mockConnectHardware,
  checkHardwareStatus: () => mockCheckHardwareStatus,
  getDeviceNameForMetric: () => mockGetgetDeviceNameForMetric,
}));

jest.mock('../../../selectors', () => ({
  getCurrentChainId: () => '0x1',
  getRpcPrefsForCurrentProvider: () => {
    return {};
  },
  getMetaMaskAccountsConnected: () => [],
  getMetaMaskAccounts: () => {
    return {};
  },
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

const mockTrackEvent = jest.fn();
const mockHistoryPush = jest.fn();
const mockProps = {
  forgetDevice: () => jest.fn(),
  showAlert: () => jest.fn(),
  hideAlert: () => jest.fn(),
  unlockHardwareWalletAccount: () => jest.fn(),
  setHardwareWalletDefaultHdPath: () => jest.fn(),
  history: {
    push: mockHistoryPush,
  },
  defaultHdPath: "m/44'/60'/0'/0",
  mostRecentOverviewPage: '',
  trackEvent: () => mockTrackEvent,
};

const mockState = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
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
      [HardwareDeviceNames.trezor]: "m/44'/60'/0'/0",
    },
    mostRecentOverviewPage: '',
    ledgerTransportType: LedgerTransportTypes.webhid,
  },
};

describe('ConnectHardwareForm', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ConnectHardwareForm {...mockProps} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should close the form when close button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ConnectHardwareForm {...mockProps} />,
      mockStore,
    );
    const closeButton = getByTestId('hardware-connect-close-btn');
    fireEvent.click(closeButton);
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(MOCK_RECENT_PAGE);
  });

  describe('U2F Error', () => {
    it('should render a U2F error', async () => {
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

    it('should render a different U2F error for firefox', async () => {
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
    it('should render the QR hardware wallet steps', async () => {
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
        expect(getByText('OneKey')).toBeInTheDocument();
        expect(getByText('Ngrave Zero')).toBeInTheDocument();
      });
    });
  });

  describe('Select Hardware', () => {
    it('should check link buttons for Ngrave Zero brand', async () => {
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
});
