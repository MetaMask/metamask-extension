import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AssetData } from '../../lib/types';
import { TokenDetail } from './token-detail';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: (path: string) => `chrome-extension://test/${path}`,
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

const asset: AssetData = {
  ticker: 'ETH',
  name: 'Ethereum',
  iconUrl: null,
  color: null,
  caipAssetId: null,
  chainId: 'eip155:1',
  isNative: true,
  resultType: 'Verified',
  price: 2000,
  change24hPercent: 2,
  marketCap: 1000000,
  liquidity: 500000,
  volume24h: 250000,
};

describe('TokenDetail', () => {
  it('renders asset data and forwards its actions', () => {
    const onSwap = jest.fn();
    const onDisable = jest.fn();
    const onViewDetails = jest.fn();
    const onViewSimilar = jest.fn();
    render(
      <TokenDetail
        data={asset}
        onSwap={onSwap}
        onDisable={onDisable}
        onViewDetails={onViewDetails}
        onViewSimilar={onViewSimilar}
      />,
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Liquidity')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Swap' }));
    fireEvent.click(screen.getByRole('button', { name: /View similar/u }));
    fireEvent.click(screen.getByText('Disable'));

    expect(onViewDetails).toHaveBeenCalledTimes(1);
    expect(onSwap).toHaveBeenCalledTimes(1);
    expect(onViewSimilar).toHaveBeenCalledTimes(1);
    expect(onDisable).toHaveBeenCalledTimes(1);
  });

  it('renders unavailable values without a similar-token action', () => {
    render(
      <TokenDetail
        data={{
          ...asset,
          resultType: null,
          price: null,
          change24hPercent: null,
          marketCap: null,
          liquidity: null,
          volume24h: null,
        }}
        onSwap={jest.fn()}
        onDisable={jest.fn()}
        onViewDetails={jest.fn()}
        onViewSimilar={null}
      />,
    );

    expect(screen.queryByRole('button', { name: /View similar/u })).toBeNull();
    expect(screen.queryByText('Liquidity')).toBeNull();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });
});
