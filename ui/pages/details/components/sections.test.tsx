import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { MetadataSection, TokensSection } from './sections';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatDateTime: () => 'formatted-date',
  }),
}));

jest.mock('../../../components/app/transaction/account-name', () => ({
  AccountName: ({ address }: { address?: string }) => (
    <span data-testid="account-name">{address}</span>
  ),
}));

jest.mock('../../../components/app/transaction/network-name', () => ({
  NetworkName: ({ chainId }: { chainId: string }) => (
    <span data-testid="network-name">{chainId}</span>
  ),
}));

jest.mock('../../../components/app/transaction/transaction-id', () => ({
  TransactionId: ({ value }: { value: string }) => (
    <span data-testid="transaction-id">{value}</span>
  ),
}));

jest.mock('../../../components/app/transaction/transaction-status', () => ({
  TransactionStatus: ({ status }: { status: string }) => (
    <span data-testid="transaction-status">{status}</span>
  ),
}));

jest.mock('./token-row', () => ({
  TokenRow: ({
    amountPlaceholder,
    token,
  }: {
    amountPlaceholder?: string;
    token?: { symbol?: string };
  }) => <div data-testid="token-row">{amountPlaceholder ?? token?.symbol}</div>,
}));

jest.mock('./shared', () => ({
  Section: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
  Row: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div data-testid="row" data-label={label}>
      {value}
    </div>
  ),
}));

describe('TokensSection', () => {
  it('passes an amount placeholder through to TokenRow', () => {
    const { container } = render(
      <TokensSection
        amountPlaceholder="..."
        tokens={[
          {
            label: 'You get',
            token: {
              direction: 'in',
              symbol: 'ETH',
              assetId: 'eip155:1/slip44:60',
            },
          },
        ]}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders nothing when no tokens are present', () => {
    const { container } = render(
      <TokensSection tokens={[{ label: 'You get' }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('MetadataSection', () => {
  it('renders a status description and omits network when chainId is missing', () => {
    const item = {
      type: 'rampBuy',
      status: 'pending',
      timestamp: 1,
      data: { from: '0xabc' },
    } as ActivityListItem;

    const { container } = render(
      <MetadataSection item={item} statusDescription="Waiting for payment" />,
    );

    expect(container).toMatchSnapshot();
  });
});
