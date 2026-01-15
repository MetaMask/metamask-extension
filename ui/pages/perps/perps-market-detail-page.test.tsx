import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';

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

      expect(mockUseNavigate).toHaveBeenCalledWith('/');
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

      const { getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByText('Details')).toBeInTheDocument();
      expect(getByText('Direction')).toBeInTheDocument();
      expect(getByText('Entry price')).toBeInTheDocument();
      expect(getByText('Liquidation price')).toBeInTheDocument();
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
