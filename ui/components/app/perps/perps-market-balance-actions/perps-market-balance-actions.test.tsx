import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { mockAccountState } from '../mocks';

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
const mockUsePerpsLiveAccount = jest.fn<
  {
    account: typeof mockAccountState | null;
    isInitialLoading: boolean;
  },
  []
>(() => ({
  account: mockAccountState,
  isInitialLoading: false,
}));
const mockTrack = jest.fn();

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrency: (value: number, _currency: string) =>
      `$${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
  }),
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => mockUsePerpsLiveAccount(),
}));

// eslint-disable-next-line import-x/first
import PerpsMarketBalanceActions from './perps-market-balance-actions';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsMarketBalanceActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockUsePerpsLiveAccount.mockReturnValue({
      account: mockAccountState,
      isInitialLoading: false,
    });
    mockTrack.mockReset();
  });

  it('renders balance information', () => {
    renderWithProvider(
      <PerpsMarketBalanceActions showActionButtons />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-balance-actions-add-funds'),
    ).toBeInTheDocument();
  });

  it('shows the Withdraw button once the account has a balance', () => {
    renderWithProvider(
      <PerpsMarketBalanceActions showActionButtons />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-balance-actions-withdraw'),
    ).toBeInTheDocument();
  });

  it('renders the persistent balance header with $0.00 and only Add funds (no Withdraw) when the account has no balance', () => {
    mockUsePerpsLiveAccount.mockReturnValue({
      account: {
        ...mockAccountState,
        totalBalance: '0',
        unrealizedPnl: '0',
      },
      isInitialLoading: false,
    });

    renderWithProvider(
      <PerpsMarketBalanceActions showActionButtons />,
      mockStore,
    );

    expect(screen.getByTestId('perps-balance-actions')).toBeInTheDocument();
    expect(screen.getByTestId('perps-balance-actions-total')).toHaveTextContent(
      '$0.00',
    );
    expect(
      screen.queryByTestId('perps-balance-actions-withdraw'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('perps-balance-actions-add-funds'),
    ).toBeInTheDocument();
  });

  describe('Learn more', () => {
    it('renders the Learn more button at $0 balance when onLearnMore is provided', () => {
      mockUsePerpsLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          totalBalance: '0',
          unrealizedPnl: '0',
        },
        isInitialLoading: false,
      });

      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onLearnMore={jest.fn()} />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-balance-actions-learn-more'),
      ).toBeInTheDocument();
    });

    it('hides the Learn more button once the account is funded even if onLearnMore is provided', () => {
      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onLearnMore={jest.fn()} />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-balance-actions-learn-more'),
      ).not.toBeInTheDocument();
    });

    it('hides the Learn more button at $0 balance when no onLearnMore handler is wired', () => {
      mockUsePerpsLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          totalBalance: '0',
          unrealizedPnl: '0',
        },
        isInitialLoading: false,
      });

      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-balance-actions-learn-more'),
      ).not.toBeInTheDocument();
    });

    it('calls onLearnMore and tracks a TUTORIAL button click at PERPS_HOME when pressed', () => {
      mockUsePerpsLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          totalBalance: '0',
          unrealizedPnl: '0',
        },
        isInitialLoading: false,
      });
      const onLearnMore = jest.fn();

      renderWithProvider(
        <PerpsMarketBalanceActions
          showActionButtons
          onLearnMore={onLearnMore}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-learn-more'));

      expect(onLearnMore).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
          [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
            PERPS_EVENT_VALUE.BUTTON_CLICKED.TUTORIAL,
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        }),
      );
    });
  });

  it('renders the loading skeleton while the initial account snapshot is being fetched', () => {
    mockUsePerpsLiveAccount.mockReturnValueOnce({
      account: null,
      isInitialLoading: true,
    });

    renderWithProvider(
      <PerpsMarketBalanceActions showActionButtons />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-balance-actions-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-balance-actions'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-balance-actions-add-funds'),
    ).not.toBeInTheDocument();
  });

  it('calls onAddFunds when eligible', () => {
    const onAddFunds = jest.fn();
    renderWithProvider(
      <PerpsMarketBalanceActions showActionButtons onAddFunds={onAddFunds} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));
    expect(onAddFunds).toHaveBeenCalledTimes(1);
  });

  describe('analytics', () => {
    it('tracks the Add funds click on the loaded header with PERPS_HOME button location', () => {
      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onAddFunds={jest.fn()} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
          [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
            PERPS_EVENT_VALUE.BUTTON_CLICKED.DEPOSIT,
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        }),
      );
    });

    it('tracks the Withdraw click on the loaded header with PERPS_HOME button location', () => {
      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onWithdraw={jest.fn()} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-withdraw'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
          [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
            PERPS_EVENT_VALUE.BUTTON_CLICKED.WITHDRAW,
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        }),
      );
    });

    it('still emits PERPS_HOME as the button location when the account has no balance (persistent header)', () => {
      mockUsePerpsLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          totalBalance: '0',
          unrealizedPnl: '0',
        },
        isInitialLoading: false,
      });

      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onAddFunds={jest.fn()} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        }),
      );
    });

    it('still tracks the Add funds click when the user is not eligible', () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onAddFunds={jest.fn()} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
            PERPS_EVENT_VALUE.BUTTON_CLICKED.DEPOSIT,
        }),
      );
    });
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal and does not call onAddFunds when user is not eligible', () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      const onAddFunds = jest.fn();
      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onAddFunds={onAddFunds} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));

      expect(onAddFunds).not.toHaveBeenCalled();
      expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    });

    it('shows the geo-block modal from the persistent Add funds button when the account has no balance and the user is not eligible', () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      mockUsePerpsLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          totalBalance: '0',
          unrealizedPnl: '0',
        },
        isInitialLoading: false,
      });

      const onAddFunds = jest.fn();
      renderWithProvider(
        <PerpsMarketBalanceActions showActionButtons onAddFunds={onAddFunds} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));

      expect(onAddFunds).not.toHaveBeenCalled();
      expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    });
  });
});
