import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsCompactBalanceActions } from './perps-compact-balance-actions';

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrency: (value: number, _currency: string) =>
      `$${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
  }),
}));

const store = configureStore({ metamask: { ...mockState.metamask } });

const renderCompact = (
  props: Partial<React.ComponentProps<typeof PerpsCompactBalanceActions>> = {},
) =>
  renderWithProvider(
    <PerpsCompactBalanceActions
      totalBalance={15250}
      availableBalance={10125}
      privacyMode={false}
      showActionButtons
      isAddFundsLoading={false}
      onAddFunds={jest.fn()}
      onWithdraw={jest.fn()}
      {...props}
    />,
    store,
  );

describe('PerpsCompactBalanceActions', () => {
  it('shows the available balance as the main amount', () => {
    renderCompact();

    expect(
      screen.getByTestId('perps-compact-balance-actions-available'),
    ).toHaveTextContent('$10,125.00');
  });

  it('shows the total and available balances when the balance is hovered', () => {
    renderCompact();
    const trigger = screen.getByTestId('perps-compact-balance-actions-trigger');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(trigger);

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      '$15,250.00 total, $10,125.00 available to trade or withdraw',
    );

    fireEvent.mouseLeave(trigger);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('masks both tooltip amounts in privacy mode', () => {
    renderCompact({ privacyMode: true });

    fireEvent.focus(
      screen.getByTestId('perps-compact-balance-actions-trigger'),
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent(
      /•+ total, •+ available to trade or withdraw/u,
    );
    expect(tooltip).not.toHaveTextContent('$');
  });

  it('calls the handlers from Add funds and Withdraw', () => {
    const onAddFunds = jest.fn();
    const onWithdraw = jest.fn();
    renderCompact({ onAddFunds, onWithdraw });

    fireEvent.click(screen.getByTestId('perps-balance-actions-add-funds'));
    fireEvent.click(screen.getByTestId('perps-balance-actions-withdraw'));

    expect(onAddFunds).toHaveBeenCalledTimes(1);
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it('hides Withdraw at a zero balance', () => {
    renderCompact({ totalBalance: 0, availableBalance: 0 });

    expect(
      screen.queryByTestId('perps-balance-actions-withdraw'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('perps-balance-actions-add-funds'),
    ).toBeInTheDocument();
  });
});
