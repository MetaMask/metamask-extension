import React from 'react';
import { render } from '@testing-library/react';
import { TokenRow } from './token-row';

jest.mock('../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: () => <div data-testid="activity-avatar" />,
}));

jest.mock('../../../components/app/chain-badge/chain-badge', () => ({
  ChainBadge: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chain-badge">{children}</div>
  ),
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatToken: jest.fn(),
  }),
}));

describe('TokenRow', () => {
  it('renders an amount placeholder with the token symbol', () => {
    const { container } = render(
      <TokenRow
        token={{
          amount: undefined,
          symbol: 'ETH',
          direction: 'in',
          assetId: 'eip155:1/slip44:60',
        }}
        amountPlaceholder="..."
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
