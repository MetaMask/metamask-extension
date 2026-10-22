import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AssetData } from '../../lib/types';
import { TokenResults } from './token-results';

jest.mock('./token-avatar', () => ({
  TokenAvatar: ({ asset }: { asset: AssetData }) => <span>{asset.name}</span>,
}));

const primary: AssetData = {
  ticker: 'ETH',
  name: 'Ethereum',
  iconUrl: null,
  color: null,
  caipAssetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  isNative: true,
  resultType: 'Verified',
  price: 2000,
  change24hPercent: 1,
  marketCap: 1000000,
  liquidity: null,
  volume24h: 500000,
};

const similar: AssetData = {
  ...primary,
  ticker: 'WETH',
  name: 'Wrapped Ether',
  caipAssetId: 'eip155:1/erc20:0x1',
  resultType: 'Warning',
  liquidity: 250000,
};

describe('TokenResults', () => {
  it('renders optional liquidity and selects a result', () => {
    const onBack = jest.fn();
    const onSelect = jest.fn();
    render(
      <TokenResults
        ticker="ETH"
        results={[primary, similar]}
        onBack={onBack}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Liquidity')).toBeInTheDocument();
    expect(screen.getByLabelText('Verified')).toBeInTheDocument();
    expect(screen.getByLabelText('Risky')).toBeInTheDocument();

    const similarRow = screen.getByText('Wrapped Ether').closest('tr');
    if (!similarRow) {
      throw new Error('Expected the similar token row');
    }
    fireEvent.click(similarRow);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onSelect).toHaveBeenCalledWith(similar);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
