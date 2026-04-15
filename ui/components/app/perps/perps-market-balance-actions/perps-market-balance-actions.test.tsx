import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockAccountState } from '../mocks';

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
const mockUsePerpsLiveAccount = jest.fn(() => ({
  account: mockAccountState,
  isInitialLoading: false,
}));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: jest.fn() }),
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

  it('calls onAddFunds when eligible', () => {
    const onAddFunds = jest.fn();
    renderWithProvider(
      <PerpsMarketBalanceActions showActionButtons onAddFunds={onAddFunds} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));
    expect(onAddFunds).toHaveBeenCalledTimes(1);
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

    it('shows geo-block modal from empty state add-funds button when not eligible', () => {
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

      fireEvent.click(
        screen.getByTestId('perps-balance-actions-add-funds-empty'),
      );

      expect(onAddFunds).not.toHaveBeenCalled();
      expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    });
  });
});
