import React from 'react';
import { fireEvent } from '@testing-library/react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import { MARKET_INSIGHTS_EVENT_VALUE } from '../../../../../shared/constants/market-insights-events';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import {
  isTokenUnderMinMarketInsightsAge,
  MARKET_INSIGHTS_MIN_TOKEN_AGE_DAYS,
  AssetMarketInsightsSection,
} from './asset-market-insights-section';

const mockUseTokenSecurityData = jest.fn();
const mockUseMarketInsights = jest.fn();
const mockTrackOpened = jest.fn();
const mockTrackingCardRef = jest.fn();
const mockUseMarketInsightsTracking = jest.fn();
const mockNavigate = jest.fn();
const mockTransitionForward = jest.fn((callback: () => void) => callback());

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../components/ui/transition', () => ({
  transitionForward: (callback: () => void) => mockTransitionForward(callback),
}));

jest.mock('../../../../hooks/useTokenSecurityData', () => ({
  useTokenSecurityData: (args: unknown) => mockUseTokenSecurityData(args),
}));

jest.mock('../../hooks/useMarketInsights', () => ({
  useMarketInsights: (assetId: unknown, enabled: unknown) =>
    mockUseMarketInsights(assetId, enabled),
}));

jest.mock('./useMarketInsightsTracking', () => ({
  useMarketInsightsTracking: (options: unknown) => {
    mockUseMarketInsightsTracking(options);
    return { cardRef: mockTrackingCardRef, trackOpened: mockTrackOpened };
  },
}));

const en = enLocale as unknown as Record<string, { message: string }>;

const assetId = 'eip155:1/erc20:0xabc' as const;

const mockReport: MarketInsightsReport = {
  digestId: 'digest-1',
  asset: 'eth',
  generatedAt: '2024-01-01T00:00:00Z',
  headline: 'Ethereum trends upward',
  summary: 'Ethereum is trending upward on strong volume.',
  trends: [
    {
      title: 'Bullish momentum',
      description: 'Bullish momentum continues',
      category: 'technical',
      impact: 'positive',
      articles: [],
      tweets: [],
    },
  ],
  sources: [],
};

describe('isTokenUnderMinMarketInsightsAge', () => {
  const minAgeDays = MARKET_INSIGHTS_MIN_TOKEN_AGE_DAYS;

  it('marks tokens created within the window as too new', () => {
    const created = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(isTokenUnderMinMarketInsightsAge(created, minAgeDays)).toBe(true);
  });

  it('marks tokens older than the window as eligible', () => {
    const created = new Date(
      Date.now() - (minAgeDays + 1) * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(isTokenUnderMinMarketInsightsAge(created, minAgeDays)).toBe(false);
  });

  it('treats a missing creation date as eligible', () => {
    expect(isTokenUnderMinMarketInsightsAge(undefined, minAgeDays)).toBe(false);
    expect(isTokenUnderMinMarketInsightsAge(null, minAgeDays)).toBe(false);
  });

  it('treats an unparseable creation date as eligible', () => {
    expect(isTokenUnderMinMarketInsightsAge('not-a-date', minAgeDays)).toBe(
      false,
    );
  });
});

describe('AssetMarketInsightsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTokenSecurityData.mockReturnValue({ securityData: null });
    mockUseMarketInsights.mockReturnValue({
      report: null,
      isLoading: false,
      error: null,
      timeAgo: '',
    });
  });

  it('renders nothing when there is no report and nothing loading', () => {
    const { queryByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    expect(queryByTestId('asset-market-insights')).not.toBeInTheDocument();
    expect(mockUseMarketInsights).toHaveBeenCalledWith(assetId, true);
  });

  it('renders the skeleton while the digest fetch is pending', () => {
    mockUseMarketInsights.mockReturnValue({
      report: null,
      isLoading: true,
      error: null,
      timeAgo: '',
    });

    const { getByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    expect(getByTestId('asset-market-insights')).toBeInTheDocument();
    expect(getByTestId('market-insights-skeleton')).toBeInTheDocument();
  });

  it('renders the entry card when a report exists', () => {
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    const { getByTestId, queryByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    expect(getByTestId('market-insights-entry-card')).toBeInTheDocument();
    expect(queryByTestId('market-insights-skeleton')).not.toBeInTheDocument();
    expect(getByTestId('market-insights-entry-card')).toHaveTextContent(
      `${en.marketInsightsFooterDisclaimer.message} • 5d ago`,
    );
  });

  it('disables insights and renders nothing for tokens under the minimum age', () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    mockUseTokenSecurityData.mockReturnValue({
      securityData: { created: twoDaysAgo } as TokenSecurityData,
    });

    const { queryByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    expect(queryByTestId('asset-market-insights')).not.toBeInTheDocument();
    expect(mockUseMarketInsights).toHaveBeenCalledWith(null, false);
  });

  it('shows insights for tokens that pass the minimum age gate', () => {
    const oldToken = new Date('2023-01-01T00:00:00Z').toISOString();
    mockUseTokenSecurityData.mockReturnValue({
      securityData: { created: oldToken } as TokenSecurityData,
    });
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    renderWithProvider(<AssetMarketInsightsSection assetId={assetId} />);

    expect(mockUseMarketInsights).toHaveBeenCalledWith(assetId, true);
  });

  it('opens and closes the disclaimer modal via the info button', () => {
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    const { getByTestId, queryByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    expect(
      queryByTestId('market-insights-disclaimer-modal'),
    ).not.toBeInTheDocument();

    fireEvent.click(getByTestId('market-insights-info-button'));

    expect(getByTestId('market-insights-disclaimer-modal')).toBeInTheDocument();

    fireEvent.click(getByTestId('market-insights-disclaimer-got-it'));

    expect(
      queryByTestId('market-insights-disclaimer-modal'),
    ).not.toBeInTheDocument();
  });

  it('wires the tracking hook to the resolved asset, report, and token details source', () => {
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    renderWithProvider(<AssetMarketInsightsSection assetId={assetId} />);

    expect(mockUseMarketInsightsTracking).toHaveBeenCalledWith({
      assetId,
      report: mockReport,
      source: MARKET_INSIGHTS_EVENT_VALUE.SOURCE.TOKEN_DETAILS,
    });
  });

  it('wires the tracking hook to a null asset when the token is too new', () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    mockUseTokenSecurityData.mockReturnValue({
      securityData: { created: twoDaysAgo } as TokenSecurityData,
    });

    renderWithProvider(<AssetMarketInsightsSection assetId={assetId} />);

    expect(mockUseMarketInsightsTracking).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: null }),
    );
  });

  it('attaches the tracking ref to the section container', () => {
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    const { container } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    expect(mockTrackingCardRef).toHaveBeenCalledWith(
      container.querySelector('[data-testid="asset-market-insights"]'),
    );
  });

  it('tracks the opened event when the card is pressed', () => {
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    const { getByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    fireEvent.click(getByTestId('market-insights-entry-card-button'));

    expect(mockTrackOpened).toHaveBeenCalledTimes(1);
  });

  it('navigates to the market insights page when the card is pressed', () => {
    mockUseMarketInsights.mockReturnValue({
      report: mockReport,
      isLoading: false,
      error: null,
      timeAgo: '5d ago',
    });

    const { getByTestId } = renderWithProvider(
      <AssetMarketInsightsSection assetId={assetId} />,
    );

    fireEvent.click(getByTestId('market-insights-entry-card-button'));

    expect(mockTrackOpened).toHaveBeenCalledTimes(1);
    expect(mockTransitionForward).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/asset/eip155:1/${encodeURIComponent(assetId)}/market-insights`,
    );
  });

  it('does not navigate when the asset is not eligible for insights', () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    mockUseTokenSecurityData.mockReturnValue({
      securityData: { created: twoDaysAgo } as TokenSecurityData,
    });

    renderWithProvider(<AssetMarketInsightsSection assetId={assetId} />);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
