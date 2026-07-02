import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { HardwareDeviceNames } from '../../../../../shared/constants/hardware-wallets';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { LEDGER_HD_PATHS, TREZOR_HD_PATHS } from '../utils/hardware-hd-paths';
import { MOCK_RAW_HARDWARE_ACCOUNTS } from '../../../../../test/unit/hardware-wallets/connect-hardware/raw-hardware-accounts';
import { SelectHardwareAccountsPage } from './select-hardware-accounts-page';
import type { SelectHardwareAccountsPageProps } from './select-hardware-accounts-page.types';

const mockConnectHardware = jest.fn();
const mockConnectHardwareAction = jest.fn();
const mockForgetDevice = jest.fn().mockResolvedValue(undefined);
const mockUnlockHardwareWalletAccounts = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../../store/actions', () => ({
  connectHardware: (...args: unknown[]) => {
    mockConnectHardwareAction(...args);
    return mockConnectHardware;
  },
  forgetDevice: () => mockForgetDevice,
  unlockHardwareWalletAccounts: () => mockUnlockHardwareWalletAccounts,
  setHardwareWalletDefaultHdPath: () => ({
    type: 'SET_HARDWARE_WALLET_DEFAULT_HD_PATH',
  }),
}));

jest.mock('../../../../selectors/selectors', () => ({
  getHDEntropyIndex: () => 0,
}));

function createMockMetaMetricsContext() {
  const mockTrackEvent = jest.fn();
  return {
    context: {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    },
    mockTrackEvent,
  };
}

const createMockState = () => ({
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
    keyrings: [],
  },
  appState: {
    defaultHdPaths: {
      [HardwareDeviceNames.ledger]: LEDGER_HD_PATHS[0].value,
      [HardwareDeviceNames.trezor]: TREZOR_HD_PATHS[0].value,
    },
  },
});

const defaultPageProps: SelectHardwareAccountsPageProps = {
  device: 'ledger',
  accounts: MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 2).map((account) => ({
    ...account,
    balance: '...',
  })),
  connectedAccounts: [],
  onBack: jest.fn(),
  onError: jest.fn(),
};

const renderPage = (props: Partial<SelectHardwareAccountsPageProps> = {}) => {
  const mergedProps: SelectHardwareAccountsPageProps = {
    ...defaultPageProps,
    ...props,
  };
  const { context, mockTrackEvent } = createMockMetaMetricsContext();
  const mockStore = configureMockStore([thunk])(createMockState());

  return {
    props: mergedProps,
    mockTrackEvent,
    ...renderWithProvider(
      <MetaMetricsContext.Provider value={context}>
        <SelectHardwareAccountsPage {...mergedProps} />
      </MetaMetricsContext.Provider>,
      mockStore,
    ),
  };
};

describe('SelectHardwareAccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectHardware.mockResolvedValue([]);
  });

  describe('account selector view', () => {
    it('renders the account selector page by default', () => {
      renderPage();

      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(2);
    });

    it('keeps the page title outside the scrollable accounts list', () => {
      renderPage();

      const scrollRegion = screen.getByTestId(
        'select-hardware-accounts-page-accounts-scroll',
      );
      const title = screen.getByTestId('select-hardware-accounts-page-title');

      expect(scrollRegion).not.toContainElement(title);
      expect(scrollRegion).toHaveClass('overflow-y-auto');
    });

    it('renders no account cards when accounts is empty', () => {
      renderPage({ accounts: [] });

      expect(
        screen.queryByTestId('hardware-account-card'),
      ).not.toBeInTheDocument();
    });

    it('hides balances on account cards', () => {
      renderPage();

      expect(
        screen.queryByTestId('hardware-account-card-total-balance'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('hardware-account-address-row-balance'),
      ).not.toBeInTheDocument();
    });

    it('tracks the account selector viewed event on mount', () => {
      const { mockTrackEvent } = renderPage({ device: 'trezor' });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          device_type: 'Trezor',
        },
      });
    });

    it('reflects selected account indices as selected account ids', () => {
      renderPage();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 2' }));

      expect(screen.getByRole('checkbox', { name: 'Account 1' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Account 2' })).toBeChecked();
    });

    it('forwards connected account state to the account cards', () => {
      renderPage({
        accounts: [
          {
            ...MOCK_RAW_HARDWARE_ACCOUNTS[0],
            balance: '...',
          },
        ],
        connectedAccounts: [
          MOCK_RAW_HARDWARE_ACCOUNTS[0].address.toLowerCase(),
        ],
      });

      expect(
        screen.getByRole('checkbox', { name: 'Account 1' }),
      ).toBeDisabled();
    });

    it('updates selection when an account card header is clicked', () => {
      renderPage();

      fireEvent.click(screen.getAllByTestId('hardware-account-card-header')[0]);

      expect(screen.getByRole('checkbox', { name: 'Account 1' })).toBeChecked();
    });

    it('calls onBack when the back button is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-back-button'),
      );

      expect(props.onBack).toHaveBeenCalledTimes(1);
    });

    it('loads more accounts when show more is clicked', async () => {
      mockConnectHardware.mockResolvedValue(
        MOCK_RAW_HARDWARE_ACCOUNTS.slice(2, 7),
      );
      renderPage({
        accounts: MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 5).map((account) => ({
          ...account,
          balance: '...',
        })),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(mockConnectHardwareAction).toHaveBeenCalledTimes(1);
      });
    });

    it('hides the show more button when the last fetched batch is smaller than five accounts', () => {
      renderPage({
        accounts: MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 3).map((account) => ({
          ...account,
          balance: '...',
        })),
      });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
    });

    it('disables the show more button while loading more accounts', async () => {
      let resolveConnectHardware: (value: unknown) => void = () => undefined;
      mockConnectHardware.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConnectHardware = resolve;
          }),
      );
      renderPage({
        accounts: MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 5).map((account) => ({
          ...account,
          balance: '...',
        })),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      expect(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      ).toBeDisabled();

      await act(async () => {
        resolveConnectHardware(MOCK_RAW_HARDWARE_ACCOUNTS.slice(5, 10));
      });
    });

    it('forgets the device and calls onBack when forget device is clicked', async () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId(
          'select-hardware-accounts-page-forget-device-button',
        ),
      );

      await waitFor(() => {
        expect(mockForgetDevice).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(props.onBack).toHaveBeenCalledTimes(1);
      });
    });

    it('disables continue when no accounts are selected', () => {
      renderPage();

      expect(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      ).toBeDisabled();
    });

    it('calls unlock when continue is clicked with selected accounts', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      );

      await waitFor(() => {
        expect(mockUnlockHardwareWalletAccounts).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents duplicate continue submissions while unlock is in progress', async () => {
      let resolveContinue: () => void = () => undefined;
      mockUnlockHardwareWalletAccounts.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveContinue = resolve;
          }),
      );
      renderPage();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

      const continueButton = screen.getByTestId(
        'select-hardware-accounts-page-continue-button',
      );

      fireEvent.click(continueButton);
      fireEvent.click(continueButton);

      expect(mockUnlockHardwareWalletAccounts).toHaveBeenCalledTimes(1);
      expect(continueButton).toBeDisabled();

      await act(async () => {
        resolveContinue();
      });

      await waitFor(() => {
        expect(continueButton).toBeEnabled();
      });
    });

    it('hides the settings button when HD path settings are not supported', () => {
      renderPage({ device: 'qr' });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-settings-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('HD path view', () => {
    it('opens the HD path page when settings is clicked', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(3);
      expect(
        screen.getByTestId('select-hd-path-page-continue-button'),
      ).toBeInTheDocument();
    });

    it('reloads accounts and returns to the account selector after confirming a path', async () => {
      mockConnectHardware.mockResolvedValue([
        { address: '0xNewPathAddress', index: 0 },
      ]);
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));
      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      await waitFor(() => {
        expect(mockConnectHardwareAction).toHaveBeenCalledTimes(1);
      });

      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
    });

    it('returns to the account selector when back is clicked on the HD path page', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByTestId('select-hd-path-page-back-button'));

      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.queryByText(tEn('selectHdPath'))).not.toBeInTheDocument();
    });

    it('returns to the account selector without reloading when Continue is clicked with the same path', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      expect(mockConnectHardwareAction).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.queryByText(tEn('selectHdPath'))).not.toBeInTheDocument();
    });

    it('does not reload accounts when a path is selected but Continue is not clicked', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));

      expect(mockConnectHardwareAction).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
    });

    it('renders HD path options for the connected device', () => {
      renderPage({ device: 'trezor' });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(3);
    });
  });
});
