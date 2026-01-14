import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsTabControlBar } from './perps-tab-control-bar';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsTabControlBar', () => {
  it('renders the control bar component', () => {
    renderWithProvider(<PerpsTabControlBar />, mockStore);

    expect(screen.getByTestId('perps-tab-control-bar')).toBeInTheDocument();
  });

  it('displays the total balance label', () => {
    renderWithProvider(<PerpsTabControlBar />, mockStore);

    expect(screen.getByText(/total balance/iu)).toBeInTheDocument();
  });

  it('displays the formatted total balance from mock data', () => {
    renderWithProvider(<PerpsTabControlBar />, mockStore);

    // Mock account state has totalBalance: '15250.00'
    expect(screen.getByText('$15,250.00')).toBeInTheDocument();
  });

  it('renders the balance row as clickable', () => {
    renderWithProvider(<PerpsTabControlBar />, mockStore);

    expect(screen.getByTestId('perps-control-bar-balance')).toBeInTheDocument();
  });

  it('calls onManageBalancePress when balance row is clicked', () => {
    const onManageBalancePress = jest.fn();
    renderWithProvider(
      <PerpsTabControlBar onManageBalancePress={onManageBalancePress} />,
      mockStore,
    );

    const balanceRow = screen.getByTestId('perps-control-bar-balance');
    fireEvent.click(balanceRow);

    expect(onManageBalancePress).toHaveBeenCalledTimes(1);
  });

  it('does not show P&L row when hasPositions is false', () => {
    renderWithProvider(<PerpsTabControlBar hasPositions={false} />, mockStore);

    expect(
      screen.queryByTestId('perps-control-bar-pnl'),
    ).not.toBeInTheDocument();
  });

  it('shows P&L row when hasPositions is true', () => {
    renderWithProvider(<PerpsTabControlBar hasPositions />, mockStore);

    expect(screen.getByTestId('perps-control-bar-pnl')).toBeInTheDocument();
  });

  it('displays the unrealized P&L label when hasPositions is true', () => {
    renderWithProvider(<PerpsTabControlBar hasPositions />, mockStore);

    expect(screen.getByText(/unrealized p&l/iu)).toBeInTheDocument();
  });

  it('displays formatted P&L value when hasPositions is true', () => {
    renderWithProvider(<PerpsTabControlBar hasPositions />, mockStore);

    // Mock account state has unrealizedPnl: '375.00' and returnOnEquity: '7.32'
    expect(screen.getByText(/\+\$375\.00/u)).toBeInTheDocument();
    expect(screen.getByText(/7\.32%/u)).toBeInTheDocument();
  });

  it('renders without onManageBalancePress callback', () => {
    renderWithProvider(<PerpsTabControlBar />, mockStore);

    const balanceRow = screen.getByTestId('perps-control-bar-balance');
    expect(() => fireEvent.click(balanceRow)).not.toThrow();
  });

  it('applies single row styling when hasPositions is false', () => {
    renderWithProvider(<PerpsTabControlBar hasPositions={false} />, mockStore);

    const balanceButton = screen.getByTestId('perps-control-bar-balance');
    expect(balanceButton).toHaveClass('perps-tab-control-bar__row--single');
  });

  it('applies top row styling when hasPositions is true', () => {
    renderWithProvider(<PerpsTabControlBar hasPositions />, mockStore);

    const balanceButton = screen.getByTestId('perps-control-bar-balance');
    expect(balanceButton).toHaveClass('perps-tab-control-bar__row--top');
  });
});

