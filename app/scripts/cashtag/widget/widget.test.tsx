import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AssetData } from '../lib/types';
import { Widget } from './widget';

jest.mock('./components/token-detail', () => ({
  TokenDetail: ({
    data,
    onSwap,
    onViewDetails,
    onViewSimilar,
  }: {
    data: AssetData;
    onSwap: () => void;
    onViewDetails: () => void;
    onViewSimilar: (() => void) | null;
  }) => (
    <div>
      <span>Detail: {data.ticker}</span>
      <button type="button" onClick={onSwap}>
        Swap active
      </button>
      <button type="button" onClick={onViewDetails}>
        View active
      </button>
      {onViewSimilar ? (
        <button type="button" onClick={onViewSimilar}>
          Similar
        </button>
      ) : null}
    </div>
  ),
}));

jest.mock('./components/token-results', () => ({
  TokenResults: ({
    results,
    onBack,
    onSelect,
  }: {
    results: AssetData[];
    onBack: () => void;
    onSelect: (asset: AssetData) => void;
  }) => (
    <div>
      <span>Results</span>
      <button type="button" onClick={onBack}>
        Back
      </button>
      <button type="button" onClick={() => onSelect(results[1])}>
        Select similar
      </button>
    </div>
  ),
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
  price: 1,
  change24hPercent: 1,
  marketCap: 1,
  liquidity: null,
  volume24h: 1,
};

const similar: AssetData = {
  ...primary,
  ticker: 'WETH',
  caipAssetId: 'eip155:1/erc20:0x1',
};

describe('Widget', () => {
  it('navigates results and applies actions to the active asset', () => {
    const onSwap = jest.fn();
    const onViewDetails = jest.fn();
    const onViewSimilar = jest.fn();
    const onSelectSimilar = jest.fn();
    render(
      <Widget
        data={primary}
        similar={[primary, similar]}
        displayTicker="ETH"
        onSwap={onSwap}
        onViewDetails={onViewDetails}
        onViewSimilar={onViewSimilar}
        onSelectSimilar={onSelectSimilar}
        onDisable={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Similar' }));
    expect(onViewSimilar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Results')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select similar' }));
    expect(onSelectSimilar).toHaveBeenCalledWith(similar);
    expect(screen.getByText('Detail: WETH')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Swap active' }));
    fireEvent.click(screen.getByRole('button', { name: 'View active' }));

    expect(onSwap).toHaveBeenCalledWith(similar);
    expect(onViewDetails).toHaveBeenCalledWith(similar);
  });
});
