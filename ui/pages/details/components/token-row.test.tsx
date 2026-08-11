import React from 'react';
import { render, screen } from '@testing-library/react';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { TokenRow } from './token-row';

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatToken: (amount: string, symbol: string) => `${amount} ${symbol}`,
  }),
}));

jest.mock('../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: ({ tokens, chainId }: { tokens: unknown; chainId?: string }) => (
    <div data-testid="activity-avatar">
      {JSON.stringify({ tokens, chainId })}
    </div>
  ),
}));

jest.mock('../../../components/app/chain-badge/chain-badge', () => ({
  ChainBadge: ({
    chainId,
    children,
  }: {
    chainId?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="chain-badge" data-chain-id={chainId ?? ''}>
      {children}
    </div>
  ),
}));

const usdcToken: TokenAmount = {
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  amount: '1000000',
  decimals: 6,
  symbol: 'USDC',
  direction: 'out',
};

// Mirrors a native send with no resolvable assetId (e.g. Chiliz/Stable).
const nativeChzToken: TokenAmount = {
  amount: '1000000000000000000',
  decimals: 18,
  symbol: 'CHZ',
  direction: 'out',
  assetType: 'native',
};

function getRenderedAvatar() {
  return JSON.parse(screen.getByTestId('activity-avatar').textContent ?? '{}');
}

describe('TokenRow', () => {
  it('renders nothing when there is no formattable amount', () => {
    const { container } = render(
      <TokenRow token={{ direction: 'out' } as TokenAmount} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('passes the token assetId through to the avatar for non-native tokens', () => {
    render(<TokenRow token={usdcToken} />);

    expect(getRenderedAvatar().tokens).toStrictEqual([
      { assetId: usdcToken.assetId, isNative: false },
    ]);
  });

  it('tags a native token and converts the row chainId to hex for the avatar', () => {
    render(<TokenRow token={nativeChzToken} chainId="eip155:88888" />);

    const avatar = getRenderedAvatar();
    // JSON round-tripping through the mock drops the undefined assetId key.
    expect(avatar.tokens).toStrictEqual([{ isNative: true }]);
    expect(avatar.chainId).toBe('0x15b38');
  });

  it('leaves a non-EVM chainId as-is for the avatar', () => {
    render(
      <TokenRow
        token={nativeChzToken}
        chainId="bip122:000000000019d6689c085ae165831e93"
      />,
    );

    expect(getRenderedAvatar().chainId).toBe(
      'bip122:000000000019d6689c085ae165831e93',
    );
  });

  it('derives a chain badge chainId from the assetId only when showNetworkBadge is set', () => {
    render(<TokenRow token={usdcToken} showNetworkBadge />);

    expect(screen.getByTestId('chain-badge')).toHaveAttribute(
      'data-chain-id',
      'eip155:1',
    );
  });

  it('omits the chain badge chainId when showNetworkBadge is not set', () => {
    render(<TokenRow token={usdcToken} />);

    expect(screen.getByTestId('chain-badge')).toHaveAttribute(
      'data-chain-id',
      '',
    );
  });
});
