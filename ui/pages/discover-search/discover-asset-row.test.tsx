import React from 'react';
import type { TrendingAsset } from '@metamask/assets-controllers';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { DiscoverAssetRow } from './discover-asset-row';

const mockStore = configureMockStore();

const baseAsset: TrendingAsset = {
  assetId: 'eip155:1/slip44:60',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  price: '100',
  marketCap: 20_000_000_000,
  aggregatedUsdVolume: 126_000_000,
  priceChangePct: { h24: '0.02' },
};

describe('DiscoverAssetRow', () => {
  const renderRow = (asset: TrendingAsset = baseAsset) => {
    const store = mockStore(mockState);
    return renderWithProvider(<DiscoverAssetRow asset={asset} />, store);
  };

  it('formats price with $ instead of US$', () => {
    const { getByText, queryByText } = renderRow({
      ...baseAsset,
      price: '64272.93',
    });

    expect(getByText('$64,272.93')).toBeInTheDocument();
    expect(queryByText(/^US\$/u)).not.toBeInTheDocument();
  });

  it('formats non-zero sub-cent prices as less than one cent', () => {
    const { getByText } = renderRow({
      ...baseAsset,
      price: '0.000131',
    });

    expect(getByText('<$0.01')).toBeInTheDocument();
  });

  it('renders verified badge for Verified security result type', () => {
    const { getByLabelText, getByTestId } = renderRow({
      ...baseAsset,
      securityData: { resultType: 'Verified' } as TrendingAsset['securityData'],
    });

    expect(getByTestId('security-badge-icon')).toBeInTheDocument();
    expect(
      getByLabelText(messages.securityTrustVerified.message),
    ).toBeInTheDocument();
  });

  it('renders Risky tag for Warning security result type', () => {
    const { getByText, queryByTestId } = renderRow({
      ...baseAsset,
      name: 'Solana',
      symbol: 'SOL',
      assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      securityData: { resultType: 'Warning' } as TrendingAsset['securityData'],
    });

    expect(getByText(messages.securityTrustRisky.message)).toBeInTheDocument();
    expect(queryByTestId('security-badge-icon')).not.toBeInTheDocument();
  });

  it('renders Risky tag for Spam security result type', () => {
    const { getByText } = renderRow({
      ...baseAsset,
      securityData: { resultType: 'Spam' } as TrendingAsset['securityData'],
    });

    expect(getByText(messages.securityTrustRisky.message)).toBeInTheDocument();
  });

  it('does not render a badge for Benign tokens', () => {
    const { queryByTestId, queryByText } = renderRow({
      ...baseAsset,
      securityData: { resultType: 'Benign' } as TrendingAsset['securityData'],
    });

    expect(queryByTestId('security-badge-icon')).not.toBeInTheDocument();
    expect(
      queryByText(messages.securityTrustRisky.message),
    ).not.toBeInTheDocument();
  });

  it('does not render a badge when securityData is missing', () => {
    const { queryByTestId, queryByText } = renderRow({
      ...baseAsset,
      securityData: undefined,
    });

    expect(queryByTestId('security-badge-icon')).not.toBeInTheDocument();
    expect(
      queryByText(messages.securityTrustRisky.message),
    ).not.toBeInTheDocument();
  });
});
