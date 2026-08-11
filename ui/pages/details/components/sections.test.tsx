import React from 'react';
import { render, screen } from '@testing-library/react';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { TokensSection } from './sections';

jest.mock('./token-row', () => ({
  TokenRow: ({
    token,
    showNetworkBadge,
    chainId,
  }: {
    token?: TokenAmount;
    showNetworkBadge?: boolean;
    chainId?: string;
  }) => (
    <div data-testid="token-row">
      {JSON.stringify({ assetId: token?.assetId, showNetworkBadge, chainId })}
    </div>
  ),
}));

const usdcToken: TokenAmount = {
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  amount: '1000000',
  direction: 'out',
};

describe('TokensSection', () => {
  it('renders nothing when there are no tokens', () => {
    const { container } = render(<TokensSection tokens={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('filters out entries without a token', () => {
    render(
      <TokensSection tokens={[{ label: 'Sent' }, { token: usdcToken }]} />,
    );

    expect(screen.getAllByTestId('token-row')).toHaveLength(1);
  });

  it('passes chainId and showBadge through to each TokenRow', () => {
    render(
      <TokensSection
        tokens={[{ token: usdcToken }]}
        showBadge
        chainId="eip155:1"
      />,
    );

    expect(screen.getByTestId('token-row')).toHaveTextContent(
      JSON.stringify({
        assetId: usdcToken.assetId,
        showNetworkBadge: true,
        chainId: 'eip155:1',
      }),
    );
  });
});
