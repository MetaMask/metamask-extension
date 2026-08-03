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
  TokenRow: ({ token }: { token?: { symbol?: string } }) => (
    <div data-testid="token-row">{token?.symbol}</div>
  ),
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
  it('renders labeled token rows', () => {
    const { container } = render(
      <TokensSection
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
  it('renders status without a description and omits network when chainId is missing', () => {
    const item = {
      type: 'send',
      status: 'pending',
      timestamp: 1,
      data: { from: '0xabc' },
    } as ActivityListItem;

    const { container } = render(<MetadataSection item={item} />);

    expect(container).toMatchSnapshot();
  });

  it('renders the network row when chainId is present', () => {
    const item = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xabc',
      data: { from: '0xabc', to: '0xdef' },
    } as ActivityListItem;

    const { container } = render(
      <MetadataSection
        item={item}
        addressRows={{ from: '0xabc', to: '0xdef' }}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
