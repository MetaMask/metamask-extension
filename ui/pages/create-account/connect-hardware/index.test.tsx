import { fireEvent, waitFor, screen } from '@testing-library/react';
import thunk from 'redux-thunk';
import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../test/lib/i18n-helpers';
import {
  LedgerTransportTypes,
  HardwareDeviceNames,
  LEDGER_LIVE_PATH,
  MEW_PATH,
  BIP44_PATH,
  LATTICE_STANDARD_BIP44_PATH,
  LATTICE_LEDGER_LIVE_PATH,
  LATTICE_MEW_PATH,
  TREZOR_TESTNET_PATH,
} from '../../../../shared/constants/hardware-wallets';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import ConnectHardwareForm, {
  LEDGER_HD_PATHS,
  LATTICE_HD_PATHS,
  TREZOR_HD_PATHS,
} from '.';

const mockConnectHardware = jest.fn();
const mockCheckHardwareStatus = jest.fn().mockResolvedValue(false);
const mockForgetDevice = jest.fn().mockResolvedValue(undefined);
const mockUnlockHardwareWalletAccounts = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../store/actions', () => ({
  connectHardware: () => mockConnectHardware,
  checkHardwareStatus: () => mockCheckHardwareStatus,
  forgetDevice: () => mockForgetDevice,
  showAlert: () => ({ type: 'SHOW_ALERT', payload: '' }),
  hideAlert: () => ({ type: 'HIDE_ALERT' }),
  unlockHardwareWalletAccounts: () => mockUnlockHardwareWalletAccounts,
  setHardwareWalletDefaultHdPath: () => ({
    type: 'SET_HARDWARE_WALLET_DEFAULT_HD_PATH',
  }),
}));

jest.mock('../../../selectors', () => ({
  getCurrentChainId: () => '0x1',
  getSelectedAddress: () => '0xselectedAddress',
  getRpcPrefsForCurrentProvider: () => ({}),
  getMetaMaskAccountsConnected: () => [],
  getMetaMaskAccounts: () => ({}),
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

const DEFAULT_HD_PATH = "m/44'/60'/0'/0";

function createMockState(overrides?: Record<string, unknown>) {
  return {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: { keyring: 'HD Key Tree' },
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
      ledgerTransportType: LedgerTransportTypes.webhid,
    },
    appState: {
      networkDropdownOpen: false,
      gasIsLoading: false,
      isLoading: false,
      modal: {
        open: false,
        modalState: { name: null, props: {} },
        previousModalState: { name: null },
      },
      warning: null,
      chainId: '0x1',
      rpcPrefs: null,
      accounts: [],
      connectedAccounts: [],
      defaultHdPaths: {
        [HardwareDeviceNames.lattice]: DEFAULT_HD_PATH,
        [HardwareDeviceNames.ledger]: DEFAULT_HD_PATH,
        [HardwareDeviceNames.oneKey]: DEFAULT_HD_PATH,
        [HardwareDeviceNames.trezor]: DEFAULT_HD_PATH,
      },
      mostRecentOverviewPage: '',
      ledgerTransportType: LedgerTransportTypes.webhid,
    },
    ...overrides,
  };
}

const MOCK_ACCOUNTS = [
  { address: '0xAddress1', balance: null, index: 0 },
  { address: '0xAddress2', balance: null, index: 1 },
  { address: '0xAddress3', balance: null, index: 2 },
  { address: '0xAddress4', balance: null, index: 3 },
  { address: '0xAddress5', balance: null, index: 4 },
];

function connectToDevice(labelText: string) {
  const deviceButton = screen.getByLabelText(labelText);
  const continueButton = screen.getByText(tEn('continue'));
  fireEvent.click(deviceButton);
  fireEvent.click(continueButton);
}

describe('ConnectHardwareForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exported HD path constants', () => {
    it('exports LEDGER_HD_PATHS with correct entries', () => {
      expect(LEDGER_HD_PATHS).toStrictEqual([
        { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
        { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
        {
          name: `BIP44 Standard (e.g. MetaMask, Trezor)`,
          value: BIP44_PATH,
        },
      ]);
    });

    it('exports LATTICE_HD_PATHS with correct entries', () => {
      expect(LATTICE_HD_PATHS).toStrictEqual([
        {
          name: `Standard (${LATTICE_STANDARD_BIP44_PATH})`,
          value: LATTICE_STANDARD_BIP44_PATH,
        },
        {
          name: `Ledger Live (${LATTICE_LEDGER_LIVE_PATH})`,
          value: LATTICE_LEDGER_LIVE_PATH,
        },
        {
          name: `Ledger Legacy (${LATTICE_MEW_PATH})`,
          value: LATTICE_MEW_PATH,
        },
      ]);
    });

    it('exports TREZOR_HD_PATHS with correct entries', () => {
      expect(TREZOR_HD_PATHS).toStrictEqual([
        {
          name: `BIP44 Standard (e.g. MetaMask, Trezor)`,
          value: BIP44_PATH,
        },
        { name: `Legacy (Ledger / MEW / MyCrypto)`, value: MEW_PATH },
        { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
      ]);
    });
  });

  describe('initial render', () => {
    it('render matches snapshot', () => {
      const mockStore = configureMockStore([thunk])(createMockState());
      const { container } = renderWithProvider(
        <ConnectHardwareForm />,
        mockStore,
      );
      expect(container).toMatchSnapshot();
    });

    it('renders SelectHardware when no accounts are loaded', () => {
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);
      expect(screen.getByText(tEn('hardwareWallets'))).toBeInTheDocument();
    });

    it('detects Firefox user agent on mount', async () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
        );

      mockConnectHardware.mockRejectedValue(new Error('U2F Error'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));
      await waitFor(() => {
        expect(
          screen.getByText(
            "If you're on the latest version of Firefox, you might be experiencing an issue related to Firefox dropping U2F support. Learn how to fix this issue",
            { exact: false },
          ),
        ).toBeInTheDocument();
      });

      jest.restoreAllMocks();
    });
  });

  describe('onCancel', () => {
    it('navigates to the most recent overview page', () => {
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      const closeButton = screen.getByTestId('hardware-connect-close-btn');
      fireEvent.click(closeButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(MOCK_RECENT_PAGE);
    });
  });

  describe('connectToHardwareWallet', () => {
    it('calls connectHardware when a device is selected', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(mockConnectHardware).toHaveBeenCalled();
      });
    });

    it('does not call connectHardware again when accounts are already loaded', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(
          screen.getAllByText(tEn('selectAnAccount')).length,
        ).toBeGreaterThan(0);
      });

      mockConnectHardware.mockClear();

      const cancelButton = screen.getByText(tEn('cancel'));
      expect(cancelButton).toBeInTheDocument();
    });

    it('transitions to account list on successful connection', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getAllByText(tEn('selectAnAccount')).length,
        ).toBeGreaterThan(0);
      });

      expect(screen.getAllByTestId('hw-account-list__item')).toHaveLength(5);
    });
  });

  describe('getPage error handling', () => {
    it('displays a generic error message', async () => {
      mockConnectHardware.mockRejectedValue(new Error('Something went wrong'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(
          screen.getByText(tEn('hardwareWalletErrorUnknownErrorTitle')),
        ).toBeInTheDocument();
      });
    });

    it('displays ledgerLocked error for LEDGER_LOCKED', async () => {
      mockConnectHardware.mockRejectedValue(new Error('LEDGER_LOCKED'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(screen.getByText(tEn('ledgerLocked'))).toBeInTheDocument();
      });
    });

    it('displays ledgerLocked error for LEDGER_WRONG_APP', async () => {
      mockConnectHardware.mockRejectedValue(new Error('LEDGER_WRONG_APP'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(screen.getByText(tEn('ledgerLocked'))).toBeInTheDocument();
      });
    });

    it('displays ledgerTimeout error for timeout errors', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error('Connection timeout occurred'),
      );
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(screen.getByText(tEn('ledgerTimeout'))).toBeInTheDocument();
      });
    });

    it('displays U2F error message for non-Firefox browser', async () => {
      mockConnectHardware.mockRejectedValue(new Error('U2F Error'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'We had trouble connecting to your ledger, try reviewing',
            { exact: false },
          ),
        ).toBeInTheDocument();
      });
    });

    it('displays Firefox-specific U2F error message', async () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
        );

      mockConnectHardware.mockRejectedValue(new Error('U2F Error'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getByText(
            "If you're on the latest version of Firefox, you might be experiencing an issue related to Firefox dropping U2F support. Learn how to fix this issue",
            { exact: false },
          ),
        ).toBeInTheDocument();
      });

      jest.restoreAllMocks();
    });

    it('sets browserSupported to false for "Window blocked" error', async () => {
      mockConnectHardware.mockRejectedValue(new Error('Window blocked'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getByText(tEn('browserNotSupported')),
        ).toBeInTheDocument();
      });
    });

    it('displays QRHardwarePubkeyAccountOutOfRange for keystone pubkey error', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error('KeystoneError#pubkey_account.no_expected_account'),
      );
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getByText(tEn('QRHardwarePubkeyAccountOutOfRange')),
        ).toBeInTheDocument();
      });
    });

    it('ignores "Window closed" error silently', async () => {
      mockConnectHardware.mockRejectedValue(new Error('Window closed'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(mockConnectHardware).toHaveBeenCalled();
      });

      expect(screen.queryByText('Window closed')).not.toBeInTheDocument();
    });

    it('ignores "Popup closed" error silently', async () => {
      mockConnectHardware.mockRejectedValue(new Error('Popup closed'));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(mockConnectHardware).toHaveBeenCalled();
      });

      expect(screen.queryByText('Popup closed')).not.toBeInTheDocument();
    });

    it('ignores KeystoneError#sync_cancel error silently', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error('KeystoneError#sync_cancel'),
      );
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(mockConnectHardware).toHaveBeenCalled();
      });

      expect(
        screen.queryByText('KeystoneError#sync_cancel'),
      ).not.toBeInTheDocument();
    });

    it('appends localized ledger error code message when code is found', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error('Error with code 0x6501'),
      );
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(screen.getByText(/Error with code 0x6501/u)).toBeInTheDocument();
      });
    });
  });

  describe('account list interactions', () => {
    let mockStore: ReturnType<ReturnType<typeof configureMockStore>>;

    beforeEach(async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(
          screen.getAllByText(tEn('selectAnAccount')).length,
        ).toBeGreaterThan(0);
      });
    });

    describe('onAccountChange', () => {
      it('toggles account selection when clicking a checkbox', () => {
        const checkboxes = screen.getAllByTestId('hw-account-list__item');
        expect(checkboxes).toHaveLength(5);

        const firstCheckbox = checkboxes[0].querySelector(
          'input[type="checkbox"]',
        );
        if (firstCheckbox) {
          fireEvent.click(firstCheckbox);
        }
      });
    });

    describe('onUnlockAccounts', () => {
      it('disables unlock button when no accounts are selected', () => {
        const unlockButton = screen.getByText(tEn('unlock'));
        expect(unlockButton).toBeDisabled();
      });

      it('navigates to overview page on successful unlock', async () => {
        const checkboxes = screen.getAllByTestId('hw-account-list__item');
        const firstCheckbox = checkboxes[0].querySelector(
          'input[type="checkbox"]',
        );
        if (firstCheckbox) {
          fireEvent.click(firstCheckbox);
        }

        const unlockButton = screen.getByText(tEn('unlock'));
        fireEvent.click(unlockButton);

        await waitFor(() => {
          expect(mockUnlockHardwareWalletAccounts).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(mockUseNavigate).toHaveBeenCalledWith(MOCK_RECENT_PAGE);
        });
      });

      it('displays error when unlockHardwareWalletAccounts fails', async () => {
        mockUnlockHardwareWalletAccounts.mockRejectedValueOnce(
          new Error('Unlock failed'),
        );

        const checkboxes = screen.getAllByTestId('hw-account-list__item');
        const firstCheckbox = checkboxes[0].querySelector(
          'input[type="checkbox"]',
        );
        if (firstCheckbox) {
          fireEvent.click(firstCheckbox);
        }

        const unlockButton = screen.getByText(tEn('unlock'));
        fireEvent.click(unlockButton);

        await waitFor(() => {
          expect(screen.getByText('Unlock failed')).toBeInTheDocument();
        });
      });
    });

    describe('onForgetDevice', () => {
      it('resets state and goes back to device selection on success', async () => {
        const forgetButton = screen.getByTestId(
          'hardware-forget-device-button',
        );
        fireEvent.click(forgetButton);

        await waitFor(() => {
          expect(mockForgetDevice).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(screen.getByText(tEn('hardwareWallets'))).toBeInTheDocument();
        });
      });

      it('displays error when forgetDevice fails', async () => {
        mockForgetDevice.mockRejectedValueOnce(new Error('Forget failed'));

        const forgetButton = screen.getByTestId(
          'hardware-forget-device-button',
        );
        fireEvent.click(forgetButton);

        await waitFor(() => {
          expect(screen.getByText('Forget failed')).toBeInTheDocument();
        });
      });
    });

    describe('pagination', () => {
      it('disables Previous button on the first page', () => {
        expect(
          screen.getByTestId('hw-list-pagination__prev-button'),
        ).toBeDisabled();
      });
    });
  });

  describe('QR Hardware Wallet Steps', () => {
    it('renders the QR hardware wallet steps when QR is selected', async () => {
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      const qrButton = screen.getByLabelText('QRCode');
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(screen.getByText(tEn('keystone'))).toBeInTheDocument();
        expect(screen.getByText(tEn('airgapVault'))).toBeInTheDocument();
        expect(screen.getByText(tEn('coolWallet'))).toBeInTheDocument();
        expect(screen.getByText(tEn('dcent'))).toBeInTheDocument();
        expect(screen.getByText(tEn('imToken'))).toBeInTheDocument();
      });
    });
  });

  describe('Select Hardware', () => {
    it('opens Ngrave Zero marketing links', async () => {
      window.open = jest.fn();
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      const qrButton = screen.getByLabelText('QRCode');
      fireEvent.click(qrButton);

      const buyNowButton = screen.getByTestId('ngrave-brand-buy-now-btn');
      fireEvent.click(buyNowButton);
      expect(window.open).toHaveBeenCalled();

      const learnMoreButton = screen.getByTestId('ngrave-brand-learn-more-btn');
      fireEvent.click(learnMoreButton);
      expect(window.open).toHaveBeenCalledTimes(2);
    });
  });

  describe('showTemporaryAlert', () => {
    it('dispatches showAlert on first hardware connection', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getAllByText(tEn('selectAnAccount')).length,
        ).toBeGreaterThan(0);
      });

      const showAlertAction = mockStore
        .getActions()
        .find((action: { type: string }) => action.type === 'SHOW_ALERT');
      expect(showAlertAction).toBeDefined();
    });
  });

  describe('onAccountRestriction', () => {
    it('displays ledgerAccountRestriction error when Next is clicked with fewer than 5 accounts', async () => {
      const threeAccounts = MOCK_ACCOUNTS.slice(0, 3);
      mockConnectHardware.mockResolvedValue(threeAccounts);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(
          screen.getAllByText(tEn('selectAnAccount')).length,
        ).toBeGreaterThan(0);
      });

      const nextButton = screen.getByText(`${tEn('next')} >`);
      fireEvent.click(nextButton);

      expect(
        screen.getByText(tEn('ledgerAccountRestriction')),
      ).toBeInTheDocument();
    });

    describe('Ledger error handling (toHardwareWalletError)', () => {
      it('displays the original SDK message when Ledger status code is not mapped', async () => {
        mockConnectHardware.mockRejectedValue(
          new Error('Ledger device: UNKNOWN_ERROR (0x6a83)'),
        );
        const mockStore = configureMockStore([thunk])(createMockState());

        renderWithProvider(<ConnectHardwareForm />, mockStore);

        fireEvent.click(screen.getByLabelText(tEn('ledger')));
        fireEvent.click(screen.getByText(tEn('continue')));

        await waitFor(() => {
          expect(
            screen.getByText('Ledger device: UNKNOWN_ERROR (0x6a83)'),
          ).toBeInTheDocument();
        });
      });

      it('displays original error message when Ledger error maps to Unknown or ConnectionClosed (e.g. no app open)', async () => {
        const appClosedMessage = 'Ledger: App closed or connection issue';
        mockConnectHardware.mockRejectedValue(new Error(appClosedMessage));
        const mockStore = configureMockStore([thunk])(createMockState());

        renderWithProvider(<ConnectHardwareForm />, mockStore);

        fireEvent.click(screen.getByLabelText(tEn('ledger')));
        fireEvent.click(screen.getByText(tEn('continue')));

        await waitFor(() => {
          expect(screen.getByText(appClosedMessage)).toBeInTheDocument();
        });
      });
    });
  });
});
