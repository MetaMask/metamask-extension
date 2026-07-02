import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { LEDGER_HD_PATHS } from '..';
import type { HardwareHdPathOptionData } from '../types';
import { MOCK_RAW_HARDWARE_ACCOUNTS } from '../../../../../test/unit/hardware-wallets/connect-hardware/raw-hardware-accounts';
import { SelectHardwareAccountsContainer } from './select-hardware-accounts-container';
import type { SelectHardwareAccountsContainerProps } from './select-hardware-accounts-container.types';

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

const defaultProps: SelectHardwareAccountsContainerProps = {
  device: 'ledger',
  accounts: MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 2),
  connectedAccounts: [],
  selectedAccountIndices: [0],
  onSelectedAccountIndicesChange: jest.fn(),
  selectedPath: LEDGER_HD_PATHS[0].value,
  hdPaths: LEDGER_HD_PATHS,
  showHdPathSettings: true,
  onPathChange: jest.fn(),
  onBack: jest.fn(),
  onShowMore: jest.fn(),
  onContinue: jest.fn(),
  onForgetDevice: jest.fn(),
  hasMoreAccounts: true,
  isLoadingMore: false,
};

const renderContainer = (
  props: Partial<SelectHardwareAccountsContainerProps> = {},
) => {
  const mergedProps: SelectHardwareAccountsContainerProps = {
    ...defaultProps,
    ...props,
  };
  const { context, mockTrackEvent } = createMockMetaMetricsContext();

  return {
    props: mergedProps,
    mockTrackEvent,
    ...renderWithProvider(
      <MetaMetricsContext.Provider value={context}>
        <SelectHardwareAccountsContainer {...mergedProps} />
      </MetaMetricsContext.Provider>,
    ),
  };
};

describe('SelectHardwareAccountsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('account selector view', () => {
    it('renders the account selector page by default', () => {
      renderContainer();

      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(2);
    });

    it('tracks the account selector viewed event on mount', () => {
      const { mockTrackEvent } = renderContainer({ device: 'trezor' });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          device_type: 'Trezor',
        },
      });
    });

    it('reflects selected account indices as selected account ids', () => {
      renderContainer({ selectedAccountIndices: [0, 1] });

      expect(screen.getByRole('checkbox', { name: 'Account 1' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Account 2' })).toBeChecked();
    });

    it('forwards connected account state to the account cards', () => {
      renderContainer({
        accounts: [MOCK_RAW_HARDWARE_ACCOUNTS[0]],
        connectedAccounts: [MOCK_RAW_HARDWARE_ACCOUNTS[0].address.toLowerCase()],
        selectedAccountIndices: [],
      });

      expect(
        screen.getByRole('checkbox', { name: 'Account 1' }),
      ).toBeDisabled();
    });

    it('calls onSelectedAccountIndicesChange when an account is selected', () => {
      const onSelectedAccountIndicesChange = jest.fn();
      renderContainer({
        selectedAccountIndices: [],
        onSelectedAccountIndicesChange,
      });

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

      expect(onSelectedAccountIndicesChange).toHaveBeenCalledWith([0]);
    });

    it('calls onSelectedAccountIndicesChange when an account is deselected', () => {
      const onSelectedAccountIndicesChange = jest.fn();
      renderContainer({
        selectedAccountIndices: [0, 1],
        onSelectedAccountIndicesChange,
      });

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

      expect(onSelectedAccountIndicesChange).toHaveBeenCalledWith([1]);
    });

    it('calls onBack when the back button is clicked', () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-back-button'),
      );

      expect(props.onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onShowMore when show more is clicked', () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      expect(props.onShowMore).toHaveBeenCalledTimes(1);
    });

    it('hides the show more button when hasMoreAccounts is false', () => {
      renderContainer({ hasMoreAccounts: false });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
    });

    it('calls onForgetDevice when forget device is clicked', () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId(
          'select-hardware-accounts-page-forget-device-button',
        ),
      );

      expect(props.onForgetDevice).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when continue is clicked', async () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      );

      await waitFor(() => {
        expect(props.onContinue).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents duplicate continue submissions while unlock is in progress', async () => {
      let resolveContinue: () => void = () => undefined;
      const onContinue = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveContinue = resolve;
          }),
      );
      renderContainer({ onContinue });

      const continueButton = screen.getByTestId(
        'select-hardware-accounts-page-continue-button',
      );

      fireEvent.click(continueButton);
      fireEvent.click(continueButton);

      expect(onContinue).toHaveBeenCalledTimes(1);
      expect(continueButton).toBeDisabled();

      await act(async () => {
        resolveContinue();
      });

      await waitFor(() => {
        expect(continueButton).toBeEnabled();
      });
    });

    it('hides the settings button when HD path settings are not supported', () => {
      renderContainer({ showHdPathSettings: false });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-settings-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('HD path view', () => {
    it('opens the HD path page when settings is clicked', () => {
      renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(3);
      expect(
        screen.getByTestId('select-hd-path-page-continue-button'),
      ).toBeInTheDocument();
    });

    it('calls onPathChange and returns to the account selector after confirming a path', () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));
      fireEvent.click(screen.getByTestId('select-hd-path-page-continue-button'));

      expect(props.onPathChange).toHaveBeenCalledWith(LEDGER_HD_PATHS[1].value);
      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
    });

    it('returns to the account selector when back is clicked on the HD path page', () => {
      renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByTestId('select-hd-path-page-back-button'));

      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.queryByText(tEn('selectHdPath'))).not.toBeInTheDocument();
    });

    it('returns to the account selector without reloading when Continue is clicked with the same path', () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByTestId('select-hd-path-page-continue-button'));

      expect(props.onPathChange).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.queryByText(tEn('selectHdPath'))).not.toBeInTheDocument();
    });

    it('does not call onPathChange when a path is selected but Continue is not clicked', () => {
      const { props } = renderContainer();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );
      fireEvent.click(screen.getByText(LEDGER_HD_PATHS[1].name));

      expect(props.onPathChange).not.toHaveBeenCalled();
      expect(screen.getByText(tEn('selectHdPath'))).toBeInTheDocument();
    });

    it('renders one HD path option per provided path', () => {
      const customPaths: HardwareHdPathOptionData[] = [
        { name: 'Custom Path A', value: "m/44'/60'/0'/0/0" },
        { name: 'Custom Path B', value: "m/44'/60'/0'/0/1" },
      ];

      renderContainer({
        hdPaths: customPaths,
        selectedPath: customPaths[0].value,
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(screen.getAllByTestId('hardware-hd-path-option')).toHaveLength(2);
      expect(screen.getByText('Custom Path A')).toBeInTheDocument();
    });
  });
});
