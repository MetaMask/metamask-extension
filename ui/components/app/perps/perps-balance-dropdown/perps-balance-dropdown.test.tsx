import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockAccountState } from '../mocks';
import { PerpsBalanceDropdown } from './perps-balance-dropdown';

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number, _currency: string) =>
      `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    formatPercentWithMinThreshold: (value: number) =>
      `${(value * 100).toFixed(2)}%`,
  }),
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => ({
    account: mockAccountState,
    isInitialLoading: false,
  }),
}));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => ({
    isEligible: true,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsBalanceDropdown', () => {
  it('renders the balance dropdown component', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(screen.getByTestId('perps-balance-dropdown')).toBeInTheDocument();
  });

  it('displays the total balance label', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(screen.getByText(/total balance/iu)).toBeInTheDocument();
  });

  it('displays the formatted total balance from mock data', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(screen.getByText('$15,625.00')).toBeInTheDocument();
  });

  it('toggles dropdown when balance row is clicked', () => {
    renderWithProvider(<PerpsBalanceDropdown />, mockStore);

    expect(
      screen.queryByTestId('perps-balance-dropdown-panel'),
    ).not.toBeInTheDocument();

    const balanceRow = screen.getByTestId('perps-balance-dropdown-balance');
    fireEvent.click(balanceRow);

    expect(
      screen.getByTestId('perps-balance-dropdown-panel'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-balance-dropdown-add-funds'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-balance-dropdown-withdraw'),
    ).toBeInTheDocument();

    fireEvent.click(balanceRow);

    expect(
      screen.queryByTestId('perps-balance-dropdown-panel'),
    ).not.toBeInTheDocument();
  });

  it('calls onAddFunds when Add funds button is clicked', () => {
    const onAddFunds = jest.fn();
    renderWithProvider(
      <PerpsBalanceDropdown onAddFunds={onAddFunds} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
    fireEvent.click(screen.getByTestId('perps-balance-dropdown-add-funds'));

    expect(onAddFunds).toHaveBeenCalledTimes(1);
  });

  it('calls onWithdraw when Withdraw button is clicked', () => {
    const onWithdraw = jest.fn();
    renderWithProvider(
      <PerpsBalanceDropdown onWithdraw={onWithdraw} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
    fireEvent.click(screen.getByTestId('perps-balance-dropdown-withdraw'));

    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it('does not show P&L row when hasPositions is false', () => {
    renderWithProvider(
      <PerpsBalanceDropdown hasPositions={false} />,
      mockStore,
    );

    expect(
      screen.queryByTestId('perps-balance-dropdown-pnl'),
    ).not.toBeInTheDocument();
  });

  it('shows P&L row when hasPositions is true', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(
      screen.getByTestId('perps-balance-dropdown-pnl'),
    ).toBeInTheDocument();
  });

  it('displays the unrealized P&L label when hasPositions is true', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(screen.getByText(/unrealized p&l/iu)).toBeInTheDocument();
  });

  it('displays formatted P&L value when hasPositions is true', () => {
    renderWithProvider(<PerpsBalanceDropdown hasPositions />, mockStore);

    expect(screen.getByText(/\+\$375\.00/u)).toBeInTheDocument();
    expect(screen.getByText(/7\.32%/u)).toBeInTheDocument();
  });
});
