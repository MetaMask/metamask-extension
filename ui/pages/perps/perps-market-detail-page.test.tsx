import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import {
  mockPositions,
  mockOrders,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
  mockTransactions,
} from '../../components/app/perps/mocks';

// Mock lightweight-charts to prevent DOM rendering issues in tests
const mockPriceLine = { options: jest.fn() };
jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({
      setData: jest.fn(),
      update: jest.fn(),
      createPriceLine: jest.fn().mockReturnValue(mockPriceLine),
      removePriceLine: jest.fn(),
      priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
      applyOptions: jest.fn(),
    }),
    applyOptions: jest.fn(),
    timeScale: jest.fn().mockReturnValue({
      fitContent: jest.fn(),
      scrollToPosition: jest.fn(),
      scrollToRealTime: jest.fn(),
      getVisibleLogicalRange: jest.fn(),
      setVisibleLogicalRange: jest.fn(),
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
      applyOptions: jest.fn(),
    }),
    panes: jest.fn().mockReturnValue([]),
    priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
    resize: jest.fn(),
    remove: jest.fn(),
    subscribeCrosshairMove: jest.fn(),
    unsubscribeCrosshairMove: jest.fn(),
  }),
  CandlestickSeries: 'CandlestickSeries',
  HistogramSeries: 'HistogramSeries',
  ColorType: { Solid: 'Solid' },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2, Solid: 0 },
  PriceScaleMode: { Normal: 0 },
}));

// Mock semver to control version comparison in tests
jest.mock('semver', () => ({
  gte: jest.fn(() => true),
}));

// Mock loglevel to prevent console noise
jest.mock('loglevel', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  },
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
}));

// Mock the PerpsControllerProvider to render children directly
jest.mock('../../providers/perps', () => ({
  PerpsControllerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
}));

jest.mock('../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({
    positions: { getCachedData: () => [], pushData: jest.fn() },
    orders: { getCachedData: () => [], pushData: jest.fn() },
    account: { getCachedData: () => null, pushData: jest.fn() },
    markets: { getCachedData: () => [], pushData: jest.fn() },
    setOptimisticTPSL: jest.fn(),
    clearOptimisticTPSL: jest.fn(),
    pushPositionsWithOverrides: jest.fn(),
    prewarm: jest.fn(),
    cleanupPrewarm: jest.fn(),
    isInitialized: () => true,
    init: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock the perps stream hooks
jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLivePositions: () => ({
    positions: mockPositions,
    isInitialLoading: false,
  }),
  usePerpsLiveOrders: () => ({
    orders: mockOrders,
    isInitialLoading: false,
  }),
  usePerpsLiveAccount: () => ({
    account: mockAccountState,
    isInitialLoading: false,
  }),
  usePerpsLiveMarketData: () => ({
    markets: [...mockCryptoMarkets, ...mockHip3Markets],
    isInitialLoading: false,
  }),
  usePerpsLiveCandles: () => ({
    candleData: {
      symbol: 'ETH',
      interval: '5m',
      candles: [
        {
          time: 1768188300000,
          open: '2500.0',
          high: '2520.0',
          low: '2490.0',
          close: '2510.0',
          volume: '100.0',
        },
      ],
    },
    isInitialLoading: false,
    isLoadingMore: false,
    hasHistoricalData: true,
    error: null,
    fetchMoreHistory: jest.fn(),
  }),
}));

// Mock usePerpsTransactionHistory hook to avoid controller dependency
jest.mock('../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: () => ({
    transactions: mockTransactions,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockUseParams = jest.fn().mockReturnValue({ symbol: 'ETH' });
const mockUseNavigate = jest.fn();
const mockNavigateComponent = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useParams: () => mockUseParams(),
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigateComponent(props);
    return null;
  },
}));

// eslint-disable-next-line import/first
import PerpsMarketDetailPage from './perps-market-detail-page';

describe('PerpsMarketDetailPage', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);

  // Create a state with perps enabled
  const createMockState = (perpsEnabled = true) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        perpsEnabledVersion: perpsEnabled
          ? { enabled: true, minimumVersion: '0.0.0' }
          : { enabled: false, minimumVersion: '99.99.99' },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ symbol: 'ETH' });
  });

  describe('when perps feature is enabled', () => {
    it('renders market detail page for ETH', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
    });

    it('displays market symbol and price', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-market-detail-price')).toBeInTheDocument();
      expect(getByText('ETH-USD')).toBeInTheDocument();
    });

    it('renders market detail page for BTC', () => {
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
      expect(getByText('BTC-USD')).toBeInTheDocument();
    });

    it('displays back button', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(
        getByTestId('perps-market-detail-back-button'),
      ).toBeInTheDocument();
    });

    it('navigates back when back button is clicked', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      const backButton = getByTestId('perps-market-detail-back-button');
      backButton.click();

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });

    it('displays market price change', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-market-detail-change')).toBeInTheDocument();
    });

    it('displays candlestick chart', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-market-detail-chart')).toBeInTheDocument();
      expect(getByTestId('perps-candlestick-chart')).toBeInTheDocument();
    });

    it('displays favorite button', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(
        getByTestId('perps-market-detail-favorite-button'),
      ).toBeInTheDocument();
    });

    it('renders HIP-3 equity market (TSLA)', () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:TSLA' });
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
      // Should display "TSLA-USD" with the stripped display name
      expect(getByText('TSLA-USD')).toBeInTheDocument();
    });

    it('displays position section when user has a position', () => {
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      // ETH has a mock position
      expect(getByText('Position')).toBeInTheDocument();
    });

    it('displays position P&L', () => {
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      // Check for P&L label
      expect(getByText('P&L')).toBeInTheDocument();
    });

    it('displays position details section', () => {
      const store = mockStore(createMockState(true));

      const { getByText, getAllByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByText('Details')).toBeInTheDocument();
      expect(getByText('Direction')).toBeInTheDocument();
      expect(getByText('Entry price')).toBeInTheDocument();
      // 'Liquidation price' appears in both the Details section and the
      // Edit Margin expandable, so use getAllByText
      expect(getAllByText('Liquidation price').length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('displays stats section', () => {
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByText('Stats')).toBeInTheDocument();
      expect(getByText('24h Volume')).toBeInTheDocument();
    });

    it('displays recent activity section', () => {
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByText('Recent Activity')).toBeInTheDocument();
    });

    it('displays learn section', () => {
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByText('Learn the basics of perps')).toBeInTheDocument();
    });

    it('expands edit margin section when margin card is clicked', () => {
      const store = mockStore(createMockState(true));

      renderWithProvider(<PerpsMarketDetailPage />, store);

      // The Edit Margin expandable is rendered but collapsed (hidden via CSS grid)
      // Before expanding, the 'Add Margin' text exists in the DOM but is not visible
      fireEvent.click(screen.getByText('Margin'));

      // After expanding, both the mode toggle and confirm button show 'Add Margin'
      const addMarginElements = screen.getAllByText('Add Margin');
      expect(addMarginElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Remove Margin')).toBeInTheDocument();
    });

    it('collapses margin section when auto close is opened (mutual exclusion)', () => {
      const store = mockStore(createMockState(true));

      renderWithProvider(<PerpsMarketDetailPage />, store);

      fireEvent.click(screen.getByText('Margin'));
      const addMarginElements = screen.getAllByText('Add Margin');
      expect(addMarginElements.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(screen.getByText('Auto close'));
      expect(screen.getByText('Take Profit')).toBeInTheDocument();
      expect(screen.getByText('Stop Loss')).toBeInTheDocument();
    });
  });

  describe('when market is not found', () => {
    it('renders error state for unknown market', () => {
      mockUseParams.mockReturnValue({ symbol: 'UNKNOWN_MARKET_XYZ' });
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByText('Market not found')).toBeInTheDocument();
    });

    it('displays the unknown market symbol in error message', () => {
      mockUseParams.mockReturnValue({ symbol: 'NONEXISTENT' });
      const store = mockStore(createMockState(true));

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(
        getByText(/The market "NONEXISTENT" could not be found/u),
      ).toBeInTheDocument();
    });

    it('displays back button on error state', () => {
      mockUseParams.mockReturnValue({ symbol: 'UNKNOWN' });
      const store = mockStore(createMockState(true));

      const { getByTestId } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(
        getByTestId('perps-market-detail-back-button'),
      ).toBeInTheDocument();
    });
  });

  describe('when perps feature is disabled', () => {
    it('redirects to home when perps is disabled', () => {
      const store = mockStore(createMockState(false));

      renderWithProvider(<PerpsMarketDetailPage />, store);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/',
          replace: true,
        }),
      );
    });
  });

  describe('when no symbol is provided', () => {
    it('redirects to home when symbol is undefined', () => {
      mockUseParams.mockReturnValue({ symbol: undefined });
      const store = mockStore(createMockState(true));

      renderWithProvider(<PerpsMarketDetailPage />, store);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/',
          replace: true,
        }),
      );
    });
  });
});
