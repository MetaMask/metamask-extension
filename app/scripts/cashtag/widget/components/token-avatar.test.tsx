import React from 'react';
import { render } from '@testing-library/react';
import type { AssetData } from '../../lib/types';
import { TokenAvatar } from './token-avatar';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: (path: string) => `chrome-extension://test/${path}`,
  },
}));

const asset: AssetData = {
  ticker: 'ETH',
  name: 'Ethereum',
  iconUrl: 'https://example.com/eth.png',
  color: null,
  caipAssetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  isNative: true,
  resultType: 'Verified',
  price: 1,
  change24hPercent: 1,
  marketCap: 1,
  liquidity: null,
  volume24h: 1,
};

describe('TokenAvatar', () => {
  it('renders the token and its network badge', () => {
    const { container } = render(<TokenAvatar asset={asset} size="lg" />);

    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(
      container.querySelector(`img[src="${asset.iconUrl}"]`),
    ).not.toBeNull();
  });

  it('omits the network badge when the chain is unknown', () => {
    const { container } = render(
      <TokenAvatar asset={{ ...asset, chainId: null }} />,
    );

    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});
