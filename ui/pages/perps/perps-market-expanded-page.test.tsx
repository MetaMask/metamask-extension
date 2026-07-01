import React from 'react';
import { render } from '@testing-library/react';

// ─── Mock variables (must be prefixed "mock" for babel-jest hoisting) ────────
const mockNavigate = jest.fn();
const mockNavigateComponent = jest.fn();
const mockUseParams = jest.fn((): { symbol: string | undefined } => ({
  symbol: 'ETH',
}));
const mockUsePerpsLiveMarketData = jest.fn(
  (): {
    markets: Record<string, unknown>[];
    isInitialLoading: boolean;
    error: Error | null;
  } => ({
    markets: [],
    isInitialLoading: false,
    error: null,
  }),
);
const mockGetIsPerpsExperienceAvailable = jest.fn(
  (..._args: unknown[]) => true,
);
const mockSelectPerpsIsTestnet = jest.fn((..._args: unknown[]) => false);
const mockSelectPerpsTradeConfigurations = jest.fn(
  (..._args: unknown[]): Record<string, unknown> => ({}),
);

// ─── Module mocks ──────────────────────────────────────────────────────────────
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigateComponent(props);
    return null;
  },
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector({})),
}));

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: (...args: unknown[]) =>
    mockGetIsPerpsExperienceAvailable(...args),
}));

jest.mock('../../selectors/perps-controller', () => ({
  selectPerpsIsTestnet: (...args: unknown[]) =>
    mockSelectPerpsIsTestnet(...args),
  selectPerpsTradeConfigurations: (...args: unknown[]) =>
    mockSelectPerpsTradeConfigurations(...args),
}));

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLiveMarketData: () => mockUsePerpsLiveMarketData(),
}));

jest.mock('../../hooks/perps/usePerpsMarketInfo', () => ({
  usePerpsMarketInfo: jest.fn(() => null),
}));

jest.mock('../../hooks/perps/usePerpsMeasurement', () => ({
  usePerpsMeasurement: jest.fn(),
}));

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../components/app/perps/perps-market-expanded', () => ({
  PerpsExpandedChartPanel: () => <div data-testid="perps-expanded-chart" />,
  PerpsExpandedHeader: () => <div data-testid="perps-expanded-header" />,
  PerpsExpandedOrderBookPanel: () => (
    <div data-testid="perps-expanded-orderbook" />
  ),
  PerpsExpandedPositionsPanel: () => (
    <div data-testid="perps-expanded-positions" />
  ),
  PerpsExpandedSkeleton: () => <div data-testid="perps-expanded-skeleton" />,
  PerpsExpandedTradePanel: () => <div data-testid="perps-expanded-trade" />,
}));

jest.mock('../../components/app/perps/perps-geo-block-modal', () => ({
  PerpsGeoBlockModal: () => null,
}));

jest.mock('../../components/app/perps/utils', () => ({
  ...jest.requireActual('../../components/app/perps/utils'),
  safeDecodeURIComponent: (val: string) => val,
}));

// Import after mocks so all factories resolve correctly
// eslint-disable-next-line import-x/first
import PerpsMarketExpandedPage from './perps-market-expanded-page';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockEthMarket = {
  symbol: 'ETH',
  name: 'Ethereum',
  maxLeverage: '20x',
  price: '$2850.00',
  change24h: '+$75.00',
  change24hPercent: '+2.63%',
  volume: '$850M',
  openInterest: '$1.8B',
  nextFundingTime: Date.now() + 3600000,
  fundingIntervalHours: 8,
  fundingRate: 0.00008,
  marketSource: undefined,
  marketType: undefined,
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('PerpsMarketExpandedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
    mockSelectPerpsIsTestnet.mockReturnValue(false);
    mockSelectPerpsTradeConfigurations.mockReturnValue({});
    mockUseParams.mockReturnValue({ symbol: 'ETH' });
    mockUsePerpsLiveMarketData.mockReturnValue({
      markets: [mockEthMarket],
      isInitialLoading: false,
      error: null,
    });
  });

  describe('guard redirects', () => {
    it('redirects to DEFAULT_ROUTE when perps experience is unavailable', () => {
      mockGetIsPerpsExperienceAvailable.mockReturnValue(false);

      render(<PerpsMarketExpandedPage />);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/', replace: true }),
      );
    });

    it('redirects to DEFAULT_ROUTE when symbol is missing from route params', () => {
      mockUseParams.mockReturnValue({ symbol: undefined });

      render(<PerpsMarketExpandedPage />);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/', replace: true }),
      );
    });
  });

  describe('loading state', () => {
    it('shows skeleton while markets are loading', () => {
      mockUsePerpsLiveMarketData.mockReturnValue({
        markets: [],
        isInitialLoading: true,
        error: null,
      });

      const { getByTestId } = render(<PerpsMarketExpandedPage />);

      expect(getByTestId('perps-expanded-skeleton')).toBeInTheDocument();
    });

    it('shows not-found (not an endless skeleton) when loading completes with an empty markets list', () => {
      mockUsePerpsLiveMarketData.mockReturnValue({
        markets: [],
        isInitialLoading: false,
        error: null,
      });

      const { getByTestId, queryByTestId } = render(
        <PerpsMarketExpandedPage />,
      );

      expect(queryByTestId('perps-expanded-skeleton')).not.toBeInTheDocument();
      expect(
        getByTestId('perps-market-expanded-not-found'),
      ).toBeInTheDocument();
    });
  });

  describe('not-found state', () => {
    it('shows not-found UI when markets are loaded but symbol is absent', () => {
      mockUseParams.mockReturnValue({ symbol: 'DOGE' });
      mockUsePerpsLiveMarketData.mockReturnValue({
        markets: [mockEthMarket],
        isInitialLoading: false,
        error: null,
      });

      const { getByTestId } = render(<PerpsMarketExpandedPage />);

      expect(
        getByTestId('perps-market-expanded-not-found'),
      ).toBeInTheDocument();
    });

    it('does not render the full page when market is not found', () => {
      mockUseParams.mockReturnValue({ symbol: 'DOGE' });
      mockUsePerpsLiveMarketData.mockReturnValue({
        markets: [mockEthMarket],
        isInitialLoading: false,
        error: null,
      });

      const { queryByTestId } = render(<PerpsMarketExpandedPage />);

      expect(
        queryByTestId('perps-market-expanded-page'),
      ).not.toBeInTheDocument();
    });
  });

  describe('happy path', () => {
    it('renders the full expanded page when market is found', () => {
      const { getByTestId } = render(<PerpsMarketExpandedPage />);

      expect(getByTestId('perps-market-expanded-page')).toBeInTheDocument();
    });

    it('does not show skeleton when market is found', () => {
      const { queryByTestId } = render(<PerpsMarketExpandedPage />);

      expect(queryByTestId('perps-expanded-skeleton')).not.toBeInTheDocument();
    });

    it('does not show not-found when market is found', () => {
      const { queryByTestId } = render(<PerpsMarketExpandedPage />);

      expect(
        queryByTestId('perps-market-expanded-not-found'),
      ).not.toBeInTheDocument();
    });

    it('renders all panel components', () => {
      const { getByTestId } = render(<PerpsMarketExpandedPage />);

      expect(getByTestId('perps-expanded-header')).toBeInTheDocument();
      expect(getByTestId('perps-expanded-chart')).toBeInTheDocument();
      expect(getByTestId('perps-expanded-orderbook')).toBeInTheDocument();
      expect(getByTestId('perps-expanded-trade')).toBeInTheDocument();
      expect(getByTestId('perps-expanded-positions')).toBeInTheDocument();
    });

    it('performs case-insensitive symbol matching for market lookup', () => {
      mockUseParams.mockReturnValue({ symbol: 'eth' });

      const { getByTestId } = render(<PerpsMarketExpandedPage />);

      expect(getByTestId('perps-market-expanded-page')).toBeInTheDocument();
    });
  });
});
