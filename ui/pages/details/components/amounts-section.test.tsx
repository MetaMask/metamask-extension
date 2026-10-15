import React from 'react';
import { render, screen, within } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useIsGasFeeSponsored } from '../../../hooks/activity/useIsGasFeeSponsored';
import { FeesRows } from './amounts-section';

jest.mock('../../../hooks/activity/useIsGasFeeSponsored', () => ({
  useIsGasFeeSponsored: jest.fn(),
}));

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

const mockUseIsGasFeeSponsored = jest.mocked(useIsGasFeeSponsored);

function renderFeesRows({
  item,
  isGasFeeSponsored = false,
}: {
  item: ActivityListItem;
  isGasFeeSponsored?: boolean;
}) {
  mockUseIsGasFeeSponsored.mockReturnValue(isGasFeeSponsored);
  return render(<FeesRows item={item} />);
}

describe('FeesRows', () => {
  beforeEach(() => {
    mockUseIsGasFeeSponsored.mockReset();
  });

  it('renders sponsored network fees as Paid by MetaMask', () => {
    renderFeesRows({
      item: {
        hash: '0xabc',
        data: {
          fees: [
            {
              amount: '6',
              symbol: 'MON',
              type: 'base',
            },
          ],
        },
      } as ActivityListItem,
      isGasFeeSponsored: true,
    });

    const row = screen.getByTestId('transaction-base-fee');

    expect(
      within(row).getByTestId('transaction-breakdown-row-title'),
    ).toHaveTextContent('Network fee');
    expect(
      within(row).getByTestId('transaction-breakdown-row-value'),
    ).toHaveTextContent('Paid by MetaMask');
    expect(screen.queryByTestId('token-fiat-value')).not.toBeInTheDocument();
  });

  it('renders base network fees as token amounts when not sponsored', () => {
    renderFeesRows({
      item: {
        hash: '0xabc',
        data: {
          fees: [
            {
              amount: '6',
              symbol: 'ETH',
              type: 'base',
            },
          ],
        },
      } as ActivityListItem,
    });

    const row = screen.getByTestId('transaction-base-fee');

    expect(
      within(row).getByTestId('transaction-breakdown-row-title'),
    ).toHaveTextContent('Network fee');
    expect(within(row).getByTestId('token-fiat-value')).toHaveTextContent('6');
    expect(within(row).getByTestId('token-label')).toHaveTextContent('ETH');
  });
});
