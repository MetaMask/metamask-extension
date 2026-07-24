import React from 'react';
import { render, screen, within } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { GAS_FEE_SPONSORED } from '../../../../shared/lib/activity/fees';
import { FeesRows } from './amounts-section';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) =>
    ({
      networkFee: 'Network fee',
      paidByMetaMask: 'Paid by MetaMask',
      priorityFee: 'Priority fee',
    })[key] ?? key,
}));

jest.mock('../../../components/app/transaction/token-fiat-value', () => ({
  TokenFiatValue: ({ token }: { token: { amount?: string } }) => (
    <span data-testid="token-fiat-value">{token.amount}</span>
  ),
}));

jest.mock('../../../components/app/transaction/token-label', () => ({
  TokenLabel: ({ symbol }: { symbol?: string }) => (
    <span data-testid="token-label">{symbol}</span>
  ),
}));

describe('FeesRows', () => {
  it('renders sponsored network fees as Paid by MetaMask', () => {
    render(
      <FeesRows
        item={
          {
            data: {
              fees: [{ type: GAS_FEE_SPONSORED }],
            },
          } as ActivityListItem
        }
      />,
    );

    const row = screen.getByTestId('transaction-base-fee');

    expect(
      within(row).getByTestId('transaction-breakdown-row-title'),
    ).toHaveTextContent('Network fee');
    expect(
      within(row).getByTestId('transaction-breakdown-row-value'),
    ).toHaveTextContent('Paid by MetaMask');
  });

  it('renders base network fees as token amounts', () => {
    render(
      <FeesRows
        item={
          {
            data: {
              fees: [
                {
                  amount: '6',
                  symbol: 'ETH',
                  type: 'base',
                },
              ],
            },
          } as ActivityListItem
        }
      />,
    );

    const row = screen.getByTestId('transaction-base-fee');

    expect(
      within(row).getByTestId('transaction-breakdown-row-title'),
    ).toHaveTextContent('Network fee');
    expect(within(row).getByTestId('token-fiat-value')).toHaveTextContent('6');
    expect(within(row).getByTestId('token-label')).toHaveTextContent('ETH');
  });
});
