import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { AssetType } from '../../../../shared/constants/transaction';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type { Asset } from '../types/asset';
import { PerpsDiscoveryBanner } from './perps-discovery-banner';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const market = {
  symbol: 'ETH',
  name: 'Ethereum',
  maxLeverage: '40x',
  price: '$4,000',
  change24h: '$100',
  change24hPercent: '2.5%',
  volume: '$1B',
};

const token: Asset = {
  type: AssetType.token,
  chainId: '0x1',
  address: '0x1234567890123456789012345678901234567890',
  symbol: 'ETH',
  decimals: 18,
  image: '',
  aggregators: ['metamask', 'coinGecko'],
};

function getStore({
  useExternalServices = true,
  markets = [market],
  positions = [],
}: {
  useExternalServices?: boolean;
  markets?: (typeof market)[];
  positions?: { symbol: string }[];
} = {}) {
  return configureMockStore()({
    metamask: {
      useExternalServices,
      activeProvider: 'hyperliquid',
      isTestnet: false,
      cachedMarketDataByProvider: {
        'hyperliquid:mainnet': {
          data: markets,
          timestamp: 0,
        },
      },
      cachedUserDataByProvider: {
        'hyperliquid:mainnet': {
          positions,
          orders: [],
          accountState: null,
          timestamp: 0,
          address: '0x123',
        },
      },
    },
  });
}

describe('PerpsDiscoveryBanner', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders for a trustworthy asset with a matching Perps market', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <PerpsDiscoveryBanner asset={token} />,
      getStore(),
    );

    expect(getByTestId('perps-discovery-banner')).toBeInTheDocument();
    expect(getByText('Trade ETH perps')).toBeInTheDocument();
    expect(getByText('Multiply your P&L up to 40x')).toBeInTheDocument();
    expect(getByTestId('perps-discovery-banner')).toHaveAttribute(
      'aria-label',
      'Trade ETH perps Multiply your P&L up to 40x',
    );
  });

  it('does not render without a matching Perps market', () => {
    const { queryByTestId } = renderWithProvider(
      <PerpsDiscoveryBanner asset={token} />,
      getStore({ markets: [] }),
    );

    expect(queryByTestId('perps-discovery-banner')).not.toBeInTheDocument();
  });

  it('does not render when Basic Functionality is off', () => {
    const { queryByTestId } = renderWithProvider(
      <PerpsDiscoveryBanner asset={token} />,
      getStore({ useExternalServices: false }),
    );

    expect(queryByTestId('perps-discovery-banner')).not.toBeInTheDocument();
  });

  it('does not render when the user holds a position in the market', () => {
    const { queryByTestId } = renderWithProvider(
      <PerpsDiscoveryBanner asset={token} />,
      getStore({ positions: [{ symbol: 'ETH' }] }),
    );

    expect(queryByTestId('perps-discovery-banner')).not.toBeInTheDocument();
  });

  it('does not render for an untrusted token', () => {
    const { queryByTestId } = renderWithProvider(
      <PerpsDiscoveryBanner asset={{ ...token, aggregators: [] }} />,
      getStore(),
    );

    expect(queryByTestId('perps-discovery-banner')).not.toBeInTheDocument();
  });

  it('renders for a native asset without token aggregators', () => {
    const { getByTestId } = renderWithProvider(
      <PerpsDiscoveryBanner
        asset={{
          type: AssetType.native,
          chainId: '0x1',
          symbol: 'ETH',
          decimals: 18,
          image: '',
          isOriginalNativeSymbol: true,
        }}
      />,
      getStore(),
    );

    expect(getByTestId('perps-discovery-banner')).toBeInTheDocument();
  });

  it('opens the matching Perps detail page', () => {
    const { getByTestId } = renderWithProvider(
      <PerpsDiscoveryBanner asset={token} />,
      getStore(),
    );

    fireEvent.click(getByTestId('perps-discovery-banner'));

    expect(mockNavigate).toHaveBeenCalledWith(
      `${PERPS_MARKET_DETAIL_ROUTE}/ETH`,
    );
  });
});
