import {
  act,
  cleanup,
  fireEvent,
  waitFor,
  screen,
} from '@testing-library/react';
import thunk from 'redux-thunk';
import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../test/lib/i18n-helpers';
import {
  LedgerTransportTypes,
  HardwareDeviceNames,
} from '../../../../shared/constants/hardware-wallets';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getIsNewHardwareWalletOnboardingEnabled } from '../../../../shared/lib/environment';
import {
  createMockRawHardwareAccounts,
  MOCK_RAW_HARDWARE_ACCOUNTS,
} from '../../../../test/unit/hardware-wallets/connect-hardware/raw-hardware-accounts';
import type { RawHardwareAccount } from './types';
import { LEDGER_HD_PATHS } from './utils/hardware-hd-paths';
import ConnectHardwareForm from '.';

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsNewHardwareWalletOnboardingEnabled: jest.fn(() => false),
}));

const mockGetIsNewHardwareWalletOnboardingEnabled =
  getIsNewHardwareWalletOnboardingEnabled as jest.MockedFunction<
    typeof getIsNewHardwareWalletOnboardingEnabled
  >;

const mockConnectHardware = jest.fn();
const mockConnectHardwareAction = jest.fn();
const mockCheckHardwareStatus = jest.fn().mockResolvedValue(false);
const mockForgetDevice = jest.fn().mockResolvedValue(undefined);
const mockUnlockHardwareWalletAccountsAction = jest.fn();
const mockUnlockHardwareWalletAccounts = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../store/actions', () => ({
  connectHardware: (...args: unknown[]) => {
    mockConnectHardwareAction(...args);
    return mockConnectHardware;
  },
  checkHardwareStatus: () => mockCheckHardwareStatus,
  forgetDevice: () => mockForgetDevice,
  showAlert: () => ({ type: 'SHOW_ALERT', payload: '' }),
  hideAlert: () => ({ type: 'HIDE_ALERT' }),
  unlockHardwareWalletAccounts: (...args: unknown[]) => {
    mockUnlockHardwareWalletAccountsAction(...args);
    return mockUnlockHardwareWalletAccounts;
  },
  setHardwareWalletDefaultHdPath: () => ({
    type: 'SET_HARDWARE_WALLET_DEFAULT_HD_PATH',
  }),
}));

const mockGetActiveQrCodeScanRequest = jest.fn().mockReturnValue(null);

jest.mock('../../../selectors', () => ({
  getCurrentChainId: () => '0x1',
  getSelectedAddress: () => '0xselectedAddress',
  getRpcPrefsForCurrentProvider: () => ({}),
  getMetaMaskAccounts: () => ({}),
  getMetaMaskAccountsConnected: () => [],
  getActiveQrCodeScanRequest: (...args: unknown[]) =>
    mockGetActiveQrCodeScanRequest(...args),
}));

jest.mock('../../../selectors/multi-srp/multi-srp', () => ({
  getShouldShowSeedPhraseReminder: () => false,
}));

jest.mock('../../../ducks/bridge/selectors', () => ({
  getAllBridgeableNetworks: () => [],
}));

const mockUseNavigate = jest.fn();
let mockLocationKey = 'default';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => ({
    pathname: '/test',
    key: mockLocationKey,
    search: '',
    hash: '',
    state: null,
  }),
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

const MOCK_ACCOUNTS: RawHardwareAccount[] = MOCK_RAW_HARDWARE_ACCOUNTS;

const DEVICE_LABEL_TO_TESTID: Record<string, string> = {
  [tEn('ledger')]: 'connect-hardware-wallet-ledger',
  [tEn('trezor')]: 'connect-hardware-wallet-trezor',
  [tEn('lattice')]: 'connect-hardware-wallet-lattice',
  [tEn('oneKey')]: 'connect-hardware-wallet-onekey',
  QRCode: 'connect-hardware-wallet-keystone',
};

function connectToDevice(labelText: string) {
  const testId = DEVICE_LABEL_TO_TESTID[labelText];
  const deviceButton = testId
    ? screen.getByTestId(testId)
    : screen.getByText(labelText);
  fireEvent.click(deviceButton);
}

describe('ConnectHardwareForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationKey = 'default';
    mockGetIsNewHardwareWalletOnboardingEnabled.mockReturnValue(false);
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

    it('does not auto-select or auto-connect a device on mount', async () => {
      mockCheckHardwareStatus.mockReset().mockResolvedValue(true);
      mockConnectHardware.mockReset();
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      expect(mockCheckHardwareStatus).not.toHaveBeenCalled();
      expect(mockConnectHardwareAction).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('hardwareWallets'))).toBeInTheDocument();
    });

    it('ignores stale account fetches after a newer device selection starts', async () => {
      let resolveLedgerFetch: (
        value: { address: string; index: number }[],
      ) => void;
      const deferredLedgerFetch = new Promise<
        { address: string; index: number }[]
      >((resolve) => {
        resolveLedgerFetch = resolve;
      });

      mockCheckHardwareStatus.mockReset().mockResolvedValue(false);
      mockConnectHardware
        .mockReset()
        .mockImplementationOnce(() => deferredLedgerFetch)
        .mockResolvedValueOnce([
          {
            address: '0x2222222222222222222222222222222222222222',
            index: 0,
          },
        ]);

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));
      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        const accountItems = screen.getAllByTestId('hw-account-list__item');
        expect(accountItems).toHaveLength(1);
        expect(accountItems[0]).toHaveTextContent('0x22...2222');
      });

      await act(async () => {
        resolveLedgerFetch?.([
          {
            address: '0x1111111111111111111111111111111111111111',
            index: 0,
          },
        ]);
      });

      await waitFor(() => {
        const accountItems = screen.getAllByTestId('hw-account-list__item');
        expect(accountItems).toHaveLength(1);
        expect(accountItems[0]).toHaveTextContent('0x22...2222');
        expect(accountItems[0]).not.toHaveTextContent('0x11...1111');
      });
    });

    it('does not start a duplicate fetch when the same device is selected again while pending', async () => {
      let resolveLedgerFetch: (
        value: { address: string; index: number }[],
      ) => void;
      const deferredLedgerFetch = new Promise<
        { address: string; index: number }[]
      >((resolve) => {
        resolveLedgerFetch = resolve;
      });

      mockCheckHardwareStatus.mockReset().mockResolvedValue(false);
      mockConnectHardware
        .mockReset()
        .mockImplementation(() => deferredLedgerFetch);
      mockConnectHardwareAction.mockClear();

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));
      connectToDevice(tEn('ledger'));

      expect(
        mockConnectHardwareAction.mock.calls.filter(
          (call: unknown[]) => call[0] === HardwareDeviceNames.ledger,
        ),
      ).toHaveLength(1);

      await act(async () => {
        resolveLedgerFetch?.([]);
      });
    });

    it('ignores stale rejected fetches after a newer device selection succeeds', async () => {
      let rejectLedgerFetch: (reason?: Error) => void;
      const deferredLedgerFetch = new Promise<
        { address: string; index: number }[]
      >((_, reject) => {
        rejectLedgerFetch = reject;
      });

      mockCheckHardwareStatus.mockReset().mockResolvedValue(false);
      mockConnectHardware
        .mockReset()
        .mockImplementationOnce(() => deferredLedgerFetch)
        .mockResolvedValueOnce([
          {
            address: '0x2222222222222222222222222222222222222222',
            index: 0,
          },
        ]);

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));
      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        const accountItems = screen.getAllByTestId('hw-account-list__item');
        expect(accountItems).toHaveLength(1);
        expect(accountItems[0]).toHaveTextContent('0x22...2222');
      });

      await act(async () => {
        rejectLedgerFetch?.(new Error('stale ledger error'));
      });

      await waitFor(() => {
        const accountItems = screen.getAllByTestId('hw-account-list__item');
        expect(accountItems).toHaveLength(1);
        expect(accountItems[0]).toHaveTextContent('0x22...2222');
      });

      expect(screen.queryByText('stale ledger error')).not.toBeInTheDocument();
    });

    it('detects Firefox user agent on mount and shows warning for Ledger', async () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
        );

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));
      await waitFor(() => {
        expect(
          screen.getByText(tEn('ledgerFirefoxNotSupportedTitle')),
        ).toBeInTheDocument();
      });

      jest.restoreAllMocks();
    });
  });

  describe('back button', () => {
    it('navigates back when location has a non-default key', () => {
      mockLocationKey = 'abc123';

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      const closeButton = screen.getByTestId('hardware-connect-close-btn');
      fireEvent.click(closeButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates to choose wallet type page on initial page load', () => {
      mockLocationKey = 'default';

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      const closeButton = screen.getByTestId('hardware-connect-close-btn');
      fireEvent.click(closeButton);

      expect(mockUseNavigate).toHaveBeenCalledWith('/choose-new-wallet-type', {
        replace: true,
        state: { fromFreshTab: true },
      });
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

    it('displays Firefox Not Supported warning when clicking Ledger on Firefox', async () => {
      jest
        .spyOn(window.navigator, 'userAgent', 'get')
        .mockReturnValue(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
        );

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getByText(tEn('ledgerFirefoxNotSupportedTitle')),
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

    it('displays mapped message when ledger error code is found', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error('Error with code 0x6501'),
      );
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Ethereum app is out of date. Please update it to continue.',
          ),
        ).toBeInTheDocument();
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
        const unlockButton = screen.getByRole('button', {
          name: tEn('unlock'),
        });
        expect(unlockButton).toBeDisabled();
      });

      it('navigates to home page on successful unlock', async () => {
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
          expect(mockUseNavigate).toHaveBeenCalledWith('/');
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

      it('passes a null hd path fallback when no path is selected', async () => {
        mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
        cleanup();

        const storeWithEmptyPath = configureMockStore([thunk])(
          createMockState({
            appState: {
              ...createMockState().appState,
              defaultHdPaths: {
                [HardwareDeviceNames.lattice]: DEFAULT_HD_PATH,
                [HardwareDeviceNames.ledger]: DEFAULT_HD_PATH,
                [HardwareDeviceNames.oneKey]: DEFAULT_HD_PATH,
                [HardwareDeviceNames.trezor]: '',
              },
            },
          }),
        );

        renderWithProvider(<ConnectHardwareForm />, storeWithEmptyPath);

        connectToDevice(tEn('trezor'));

        await waitFor(() => {
          expect(
            screen.getAllByText(tEn('selectAnAccount')).length,
          ).toBeGreaterThan(0);
        });

        const checkboxes = screen.getAllByTestId('hw-account-list__item');
        const firstCheckbox = checkboxes[0].querySelector(
          'input[type="checkbox"]',
        );
        if (firstCheckbox) {
          fireEvent.click(firstCheckbox);
        }

        fireEvent.click(
          screen.getByTestId('connect-hardware-account-list-unlock-btn'),
        );

        await waitFor(() => {
          expect(mockUnlockHardwareWalletAccountsAction).toHaveBeenCalledWith(
            [0],
            HardwareDeviceNames.trezor,
            null,
            '',
          );
        });
      });
    });

    describe('onCancel', () => {
      it('returns to device selection view on cancel', async () => {
        const cancelButton = screen.getByTestId(
          'connect-hardware-account-list-cancel-btn',
        );
        fireEvent.click(cancelButton);

        await waitFor(() => {
          expect(screen.getByText(tEn('hardwareWallets'))).toBeInTheDocument();
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

  describe('QR Hardware Wallet', () => {
    it('calls connectHardware when Keystone wallet option is clicked', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice('QRCode');

      await waitFor(() => {
        expect(mockConnectHardwareAction).toHaveBeenCalled();
      });
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
      it('displays SDK userMessage when Ledger error has a mapped status code (e.g. 0x6a83 wrong app)', async () => {
        mockConnectHardware.mockRejectedValue(
          new Error('Ledger device: UNKNOWN_ERROR (0x6a83)'),
        );
        const mockStore = configureMockStore([thunk])(createMockState());

        renderWithProvider(<ConnectHardwareForm />, mockStore);

        connectToDevice(tEn('ledger'));

        await waitFor(() => {
          expect(
            screen.getByText(
              'Ethereum app is closed. Please open it to continue.',
            ),
          ).toBeInTheDocument();
        });
      });

      it('displays original error message when Ledger error maps to Unknown or ConnectionClosed (e.g. no app open)', async () => {
        const appClosedMessage = 'Ledger: App closed or connection issue';
        mockConnectHardware.mockRejectedValue(new Error(appClosedMessage));
        const mockStore = configureMockStore([thunk])(createMockState());

        renderWithProvider(<ConnectHardwareForm />, mockStore);

        connectToDevice(tEn('ledger'));

        await waitFor(() => {
          expect(screen.getByText(appClosedMessage)).toBeInTheDocument();
        });
      });
    });
  });

  describe('new hardware wallet onboarding flow', () => {
    beforeEach(() => {
      mockGetIsNewHardwareWalletOnboardingEnabled.mockReturnValue(true);
    });

    it('renders the legacy account list when the feature flag is disabled', async () => {
      mockGetIsNewHardwareWalletOnboardingEnabled.mockReturnValue(false);
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hw-account-list__item')).toHaveLength(5);
      });
      expect(
        screen.queryByTestId('hardware-account-card'),
      ).not.toBeInTheDocument();
    });

    it('renders the redesigned account selector when the feature flag is enabled', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });
      expect(
        screen.queryByTestId('hw-account-list__item'),
      ).not.toBeInTheDocument();
    });

    it('hides balances on the redesigned account selector when they are unavailable', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      expect(
        screen.queryByTestId('hardware-account-card-total-balance'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('hardware-account-address-row-balance'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('hides the HD path settings button for QR hardware devices', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice('QRCode');

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-settings-button'),
      ).not.toBeInTheDocument();
    });

    it('hides show more when the last fetched batch is smaller than five accounts', async () => {
      mockConnectHardware.mockResolvedValue(createMockRawHardwareAccounts(3));
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(3);
      });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
    });

    it('reloads accounts when the HD path is changed', async () => {
      const pathChangedAccounts = [{ address: '0xNewPathAddress', index: 0 }];
      mockConnectHardware
        .mockResolvedValueOnce(MOCK_ACCOUNTS)
        .mockResolvedValueOnce(pathChangedAccounts);

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('ledger'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));
      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      await waitFor(() => {
        expect(mockConnectHardwareAction).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(1);
      });
    });

    it('returns to device selection when back is clicked on the new account page', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-back-button'),
      );

      await waitFor(() => {
        expect(screen.getByText(tEn('hardwareWallets'))).toBeInTheDocument();
      });
    });

    it('loads more accounts in batches of five when show more is clicked', async () => {
      const nextBatch = createMockRawHardwareAccounts(5, 5);
      mockConnectHardware
        .mockResolvedValueOnce(MOCK_ACCOUNTS)
        .mockResolvedValueOnce(nextBatch);

      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(10);
      });

      expect(mockConnectHardwareAction).toHaveBeenLastCalledWith(
        HardwareDeviceNames.trezor,
        1,
        expect.any(String),
        false,
        expect.any(Function),
      );
    });

    it('navigates to home when continue is clicked with selected accounts', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      );

      await waitFor(() => {
        expect(mockUnlockHardwareWalletAccounts).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('resets to device selection after forget device on the new account page', async () => {
      mockConnectHardware.mockResolvedValue(MOCK_ACCOUNTS);
      const mockStore = configureMockStore([thunk])(createMockState());
      renderWithProvider(<ConnectHardwareForm />, mockStore);

      connectToDevice(tEn('trezor'));

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      });

      fireEvent.click(
        screen.getByTestId(
          'select-hardware-accounts-page-forget-device-button',
        ),
      );

      await waitFor(() => {
        expect(mockForgetDevice).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(tEn('hardwareWallets'))).toBeInTheDocument();
      });
    });
  });
});
