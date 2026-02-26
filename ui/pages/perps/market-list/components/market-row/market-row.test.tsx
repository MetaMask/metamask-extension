import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import type { PerpsMarketData } from '../../../../../components/app/perps/types';
import { MarketRow } from './market-row';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const createMockMarket = (
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData => ({
  symbol: overrides.symbol ?? 'BTC',
  name: overrides.name ?? 'Bitcoin',
  maxLeverage: overrides.maxLeverage ?? '50x',
  price: overrides.price ?? '$50,000',
  change24h: overrides.change24h ?? '+$1,250.00',
  change24hPercent: overrides.change24hPercent ?? '+2.5%',
  volume: overrides.volume ?? '$1.2B',
  openInterest: 'openInterest' in overrides ? overrides.openInterest : '$500M',
  nextFundingTime: overrides.nextFundingTime,
  fundingIntervalHours: overrides.fundingIntervalHours,
  fundingRate: 'fundingRate' in overrides ? overrides.fundingRate : 0.01,
  marketSource: overrides.marketSource,
  marketType: overrides.marketType,
});

describe('MarketRow', () => {
  const defaultProps = {
    market: createMockMarket(),
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the market row', () => {
      renderWithProvider(<MarketRow {...defaultProps} />, mockStore);

      expect(screen.getByTestId('market-row-BTC')).toBeInTheDocument();
    });

    it('displays the market symbol', () => {
      renderWithProvider(<MarketRow {...defaultProps} />, mockStore);

      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    it('displays the market price', () => {
      renderWithProvider(<MarketRow {...defaultProps} />, mockStore);

      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    it('displays the 24h change', () => {
      renderWithProvider(<MarketRow {...defaultProps} />, mockStore);

      expect(screen.getByText('+2.5%')).toBeInTheDocument();
    });

    it('displays the max leverage', () => {
      renderWithProvider(<MarketRow {...defaultProps} />, mockStore);

      expect(screen.getByText('50x')).toBeInTheDocument();
    });
  });

  describe('HIP-3 symbols', () => {
    it('handles HIP-3 symbols with colon', () => {
      const market = createMockMarket({ symbol: 'xyz:TSLA', name: 'Tesla' });
      renderWithProvider(<MarketRow market={market} />, mockStore);

      // Test ID should have colon replaced with dash
      expect(screen.getByTestId('market-row-xyz-TSLA')).toBeInTheDocument();
      // Display symbol should show just the asset name
      expect(screen.getByText('TSLA')).toBeInTheDocument();
    });
  });

  describe('display metrics', () => {
    it('displays volume metric by default', () => {
      renderWithProvider(<MarketRow {...defaultProps} />, mockStore);

      expect(screen.getByText(/\$1\.2B Vol/u)).toBeInTheDocument();
    });

    it('displays price change metric when specified', () => {
      renderWithProvider(
        <MarketRow {...defaultProps} displayMetric="priceChange" />,
        mockStore,
      );

      // Should show the change percentage (not Vol)
      expect(screen.queryByText(/Vol/u)).not.toBeInTheDocument();
    });

    it('displays funding rate metric when specified', () => {
      renderWithProvider(
        <MarketRow {...defaultProps} displayMetric="fundingRate" />,
        mockStore,
      );

      expect(screen.getByText(/FR/u)).toBeInTheDocument();
    });

    it('displays open interest metric when specified', () => {
      renderWithProvider(
        <MarketRow {...defaultProps} displayMetric="openInterest" />,
        mockStore,
      );

      expect(screen.getByText(/\$500M OI/u)).toBeInTheDocument();
    });

    it('handles missing funding rate', () => {
      const market = createMockMarket({ fundingRate: undefined });
      renderWithProvider(
        <MarketRow market={market} displayMetric="fundingRate" />,
        mockStore,
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('handles missing open interest', () => {
      const market = createMockMarket({ openInterest: undefined });
      renderWithProvider(
        <MarketRow market={market} displayMetric="openInterest" />,
        mockStore,
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('price change color', () => {
    it('shows positive change in success color', () => {
      const market = createMockMarket({ change24hPercent: '+5.0%' });
      renderWithProvider(<MarketRow market={market} />, mockStore);

      const changeElement = screen.getByText('+5.0%');
      expect(changeElement).toBeInTheDocument();
    });

    it('shows negative change in error color', () => {
      const market = createMockMarket({ change24hPercent: '-3.2%' });
      renderWithProvider(<MarketRow market={market} />, mockStore);

      const changeElement = screen.getByText('-3.2%');
      expect(changeElement).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onPress when clicked', () => {
      const onPress = jest.fn();
      renderWithProvider(
        <MarketRow {...defaultProps} onPress={onPress} />,
        mockStore,
      );

      const row = screen.getByTestId('market-row-BTC');
      fireEvent.click(row);

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledWith(defaultProps.market);
    });

    it('does not throw when onPress is not provided', () => {
      renderWithProvider(<MarketRow market={defaultProps.market} />, mockStore);

      const row = screen.getByTestId('market-row-BTC');
      expect(() => fireEvent.click(row)).not.toThrow();
    });
  });
});
