import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { ApprovalDetails } from './approval-details';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) =>
    ({ token: 'Token', unlimited: 'Unlimited' })[key] ?? key,
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatToken: (
      value: `${number}`,
      symbol: string,
      options: Intl.NumberFormatOptions,
    ) =>
      `${new Intl.NumberFormat('en-US', options).format(Number(value))} ${symbol}`,
  }),
}));

jest.mock('../../../hooks/useTokensData', () => ({
  useTokensData: () => ({}),
}));

jest.mock('../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: () => <div data-testid="activity-avatar" />,
}));

jest.mock('../components/sections', () => ({
  MetadataSection: () => <div data-testid="metadata-section" />,
}));

jest.mock('../components/amounts-section', () => ({
  FeesRows: () => <div data-testid="fees-rows" />,
  TotalAmountRow: () => <div data-testid="total-amount-row" />,
}));

jest.mock('../components/shared', () => ({
  Footer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="footer">{children}</div>
  ),
  Section: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
}));

jest.mock('../components/block-explorer-button', () => ({
  BlockExplorerButton: () => <div data-testid="block-explorer-button" />,
}));

type ApprovalItem = Extract<
  ActivityListItem,
  {
    type: 'approveSpendingCap' | 'increaseSpendingCap' | 'revokeSpendingCap';
  }
>;

const usdtAssetId = 'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7';

function buildItem(
  type: ApprovalItem['type'],
  amount: string | undefined,
): ApprovalItem {
  return {
    type,
    chainId: 'eip155:1',
    status: 'success',
    timestamp: 1716367781000,
    hash: '0x123',
    data: {
      from: '0x1111111111111111111111111111111111111111',
      token: {
        amount,
        assetId: usdtAssetId,
        decimals: 6,
        direction: 'out',
        symbol: 'USDT',
      },
    },
  };
}

const mappedAmountTypes = [
  'approveSpendingCap',
  'increaseSpendingCap',
] as const;

describe('ApprovalDetails', () => {
  for (const type of mappedAmountTypes) {
    it(`renders the mapped amount for ${type} activity`, () => {
      const { getByText } = render(
        <ApprovalDetails item={buildItem(type, '50000000000')} />,
      );

      expect(getByText('50,000 USDT')).toBeInTheDocument();
    });
  }

  it('renders Unlimited when the mapped approval omits its unlimited amount', () => {
    const { getByText } = render(
      <ApprovalDetails item={buildItem('approveSpendingCap', undefined)} />,
    );

    expect(getByText('Unlimited USDT')).toBeInTheDocument();
  });

  it('renders 0 for revoke activity regardless of its mapped token amount', () => {
    const { getByText } = render(
      <ApprovalDetails item={buildItem('revokeSpendingCap', '50000000000')} />,
    );

    expect(getByText('0 USDT')).toBeInTheDocument();
  });
});
