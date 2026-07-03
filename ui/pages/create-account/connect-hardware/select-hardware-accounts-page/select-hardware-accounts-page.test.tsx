import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  HardwareConnectLegacyErrorMessage,
  HardwareDeviceNames,
} from '../../../../../shared/constants/hardware-wallets';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import {
  createDefaultSelectHardwareAccountsPageProps,
  createMockMetaMetricsContext,
  createMockRawHardwareAccounts,
  createSelectHardwareAccountsMockStore,
  MOCK_RAW_HARDWARE_ACCOUNTS,
  toHardwareConnectAccounts,
} from '../../../../../test/unit/hardware-wallets/connect-hardware/fixtures';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { LEDGER_HD_PATHS } from '../utils/hardware-hd-paths';
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

const renderPage = (props: Partial<SelectHardwareAccountsPageProps> = {}) => {
  const mergedProps = createDefaultSelectHardwareAccountsPageProps(props);
  const { context, mockTrackEvent } = createMockMetaMetricsContext();
  const mockStore = createSelectHardwareAccountsMockStore();

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

  describe('rendering', () => {
    it('renders the account selector with the provided accounts', () => {
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

    it('hides the settings button for devices without HD path settings', () => {
      renderPage({ device: HardwareDeviceNames.qr });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-settings-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('metrics', () => {
    it('tracks the account selector viewed event on mount', () => {
      const { mockTrackEvent } = renderPage({
        device: HardwareDeviceNames.trezor,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          device_type: 'Trezor',
        },
      });
    });
  });

  describe('account selection', () => {
    it('selects and deselects accounts via checkbox', () => {
      renderPage();

      const accountOne = screen.getByRole('checkbox', { name: 'Account 1' });
      const accountTwo = screen.getByRole('checkbox', { name: 'Account 2' });

      fireEvent.click(accountOne);
      fireEvent.click(accountTwo);
      expect(accountOne).toBeChecked();
      expect(accountTwo).toBeChecked();

      fireEvent.click(accountOne);
      expect(accountOne).not.toBeChecked();
      expect(accountTwo).toBeChecked();
    });

    it('selects an account when the card header is clicked', () => {
      renderPage();

      fireEvent.click(screen.getAllByTestId('hardware-account-card-header')[0]);

      expect(screen.getByRole('checkbox', { name: 'Account 1' })).toBeChecked();
    });

    it('disables already connected accounts', () => {
      renderPage({
        accounts: toHardwareConnectAccounts([MOCK_RAW_HARDWARE_ACCOUNTS[0]]),
        connectedAccounts: [
          MOCK_RAW_HARDWARE_ACCOUNTS[0].address.toLowerCase(),
        ],
      });

      expect(
        screen.getByRole('checkbox', { name: 'Account 1' }),
      ).toBeDisabled();
    });

    it('clears the parent error when the selection changes', () => {
      const { props } = renderPage();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

      expect(props.onError).toHaveBeenCalledWith(null);
    });
  });

  describe('pagination', () => {
    it('hides show more when the initial batch is smaller than five accounts', () => {
      renderPage({
        accounts: toHardwareConnectAccounts(
          MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 3),
        ),
      });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
    });

    it('appends the next batch when show more is clicked', async () => {
      mockConnectHardware.mockResolvedValue(
        createMockRawHardwareAccounts(5, 5),
      );
      renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(10);
      });
      expect(mockConnectHardwareAction).toHaveBeenCalledWith(
        HardwareDeviceNames.ledger,
        1,
        LEDGER_HD_PATHS[0].value,
        false,
        expect.any(Function),
      );
    });

    it('disables show more while the next batch is loading', async () => {
      let resolveConnectHardware: (value: unknown) => void = () => undefined;
      mockConnectHardware.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConnectHardware = resolve;
          }),
      );
      renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      const showMoreButton = screen.getByTestId(
        'select-hardware-accounts-page-show-more-button',
      );
      fireEvent.click(showMoreButton);

      expect(showMoreButton).toBeDisabled();

      await act(async () => {
        resolveConnectHardware(createMockRawHardwareAccounts(5, 5));
      });
    });

    it('forwards fetch failures to onError', async () => {
      mockConnectHardware.mockRejectedValue(new Error('Fetch failed'));
      const { props } = renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(props.onError).toHaveBeenCalledWith('Fetch failed');
      });
    });

    it('does not call onError when fetch fails with a suppressed error', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error(HardwareConnectLegacyErrorMessage.WindowClosed),
      );
      const { props } = renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(mockConnectHardwareAction).toHaveBeenCalled();
      });
      expect(props.onError).not.toHaveBeenCalled();
    });

    it('forwards legacy ledger locked fetch errors to onError', async () => {
      mockConnectHardware.mockRejectedValue(
        new Error(HardwareConnectLegacyErrorMessage.LedgerLocked),
      );
      const { props } = renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(props.onError).toHaveBeenCalledWith(tEn('ledgerLocked'));
      });
    });

    it('hides show more after a partial batch is appended', async () => {
      mockConnectHardware.mockResolvedValue(createMockRawHardwareAccounts(3, 5));
      renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(8);
      });
      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('continue and unlock', () => {
    it('disables continue when no accounts are selected', () => {
      renderPage();

      expect(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      ).toBeDisabled();
    });

    it('unlocks selected accounts when continue is clicked', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      );

      await waitFor(() => {
        expect(mockUnlockHardwareWalletAccounts).toHaveBeenCalledTimes(1);
      });
    });

    it('forwards unlock failures to onError', async () => {
      mockUnlockHardwareWalletAccounts.mockRejectedValueOnce(
        new Error('Unlock failed'),
      );
      const { props } = renderPage();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      );

      await waitFor(() => {
        expect(props.onError).toHaveBeenCalledWith('Unlock failed');
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
  });

  describe('navigation', () => {
    it('calls onBack when the back button is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-back-button'),
      );

      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('forget device', () => {
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
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });

    it('forwards forget failures to onError without navigating back', async () => {
      mockForgetDevice.mockRejectedValueOnce(new Error('Forget failed'));
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId(
          'select-hardware-accounts-page-forget-device-button',
        ),
      );

      await waitFor(() => {
        expect(props.onError).toHaveBeenCalledWith('Forget failed');
      });
      expect(props.onBack).not.toHaveBeenCalled();
    });
  });

  describe('HD path settings', () => {
    it('opens the HD path page when settings is clicked', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(3);
    });

    it('renders trezor HD path options for trezor devices', () => {
      renderPage({ device: HardwareDeviceNames.trezor });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(3);
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

    it('returns without reloading when Continue is clicked with the same path', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      expect(mockConnectHardwareAction).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
    });

    it('does not reload accounts when a new path is selected but not confirmed', () => {
      renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));

      expect(mockConnectHardwareAction).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
    });

    it('reloads accounts and returns to the account selector after confirming a new path', async () => {
      const pathChangedAccount = createMockRawHardwareAccounts(1, 0)[0];
      mockConnectHardware.mockResolvedValue([pathChangedAccount]);
      renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

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
      expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(1);
    });

    it('clears accounts when a path reload returns no accounts', async () => {
      mockConnectHardware.mockResolvedValue([]);
      renderPage({
        accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS),
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));
      fireEvent.click(
        screen.getByTestId('select-hd-path-page-continue-button'),
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('hardware-account-card'),
        ).not.toBeInTheDocument();
      });
    });
  });
});
