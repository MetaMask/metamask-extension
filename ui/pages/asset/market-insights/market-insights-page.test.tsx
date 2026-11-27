import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import type { CaipAssetType } from '@metamask/utils';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { ThemeType } from '../../../../shared/constants/preferences';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import MarketInsightsPage, {
  getStickyFooterAsset,
} from './market-insights-page';

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockUseMarketInsights = jest.fn();
const mockUseRouteAssetToken = jest.fn();
const mockGetFungibleAssetForRoute = jest.fn();
const mockUseTheme = jest.fn();
const mockTransitionBack = jest.fn((callback: () => void) => callback());
const mockUseMarketInsightsViewTracking = jest.fn();
const mockTrackInteraction = jest.fn();
const mockTrackClosed = jest.fn();
const mockToastSuccess = jest.fn();
const mockOpen = jest.fn();

const unsafeUrl = ['java', 'script:alert(1)'].join('');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

jest.mock('../hooks/useMarketInsights', () => ({
  ...jest.requireActual('../hooks/useMarketInsights'),
  useMarketInsights: (assetId: unknown, enabled: unknown) =>
    mockUseMarketInsights(assetId, enabled),
}));

jest.mock('../hooks/useRouteAssetToken', () => ({
  useRouteAssetToken: (args: unknown) => mockUseRouteAssetToken(args),
}));

jest.mock('../../../selectors/assets', () => ({
  getFungibleAssetForRoute: (state: unknown, args: unknown) =>
    mockGetFungibleAssetForRoute(state, args),
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

jest.mock('../../../components/ui/transition', () => ({
  transitionBack: (callback: () => void) => mockTransitionBack(callback),
}));

jest.mock('../../../components/ui/toast/toast', () => ({
  ToastContent: () => null,
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

jest.mock('./useMarketInsightsViewTracking', () => ({
  useMarketInsightsViewTracking: (options: unknown) => {
    mockUseMarketInsightsViewTracking(options);
    return {
      trackInteraction: mockTrackInteraction,
      trackClosed: mockTrackClosed,
    };
  },
}));

jest.mock('../components/asset-sticky-actions', () => {
  const reactModule = jest.requireActual('react');
  return {
    AssetStickyActions: ({
      asset,
      onSwapPress,
      onBuyPress,
    }: {
      asset: { symbol?: string } | null;
      onSwapPress?: () => void;
      onBuyPress?: () => void;
    }) =>
      reactModule.createElement(
        'div',
        {
          'data-testid': 'market-insights-sticky-actions',
          'data-symbol': asset?.symbol,
        },
        [
          reactModule.createElement(
            'button',
            {
              key: 'swap',
              type: 'button',
              'data-testid': 'mock-swap-button',
              onClick: onSwapPress,
            },
            'Swap',
          ),
          reactModule.createElement(
            'button',
            {
              key: 'buy',
              type: 'button',
              'data-testid': 'mock-buy-button',
              onClick: onBuyPress,
            },
            'Buy',
          ),
        ],
      ),
  };
});

const en = enLocale as unknown as Record<string, { message: string }>;

const assetId = 'eip155:1/erc20:0xabc' as CaipAssetType;

const fiveHoursAgo = () =>
  new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

const mockReport: MarketInsightsReport = {
  digestId: 'digest-1',
  asset: 'eth',
  generatedAt: fiveHoursAgo(),
  headline: 'Ethereum trends upward',
  summary: 'Ethereum is trending upward on strong volume.',
  trends: [
    {
      title: 'Bullish momentum',
      description: 'Bullish momentum continues',
      category: 'technical',
      impact: 'positive',
      articles: [
        {
          title: 'Ethereum scales with new upgrade',
          url: 'https://example.com/ethereum-scales',
          source: 'Example News',
          date: fiveHoursAgo(),
        },
      ],
      tweets: [
        {
          contentSummary: 'Bullish on ETH long term.',
          url: 'https://x.com/ethanalyst/status/1',
          author: '@ethanalyst',
          date: fiveHoursAgo(),
        },
      ],
    },
  ],
  sources: [],
};

const mockToken = {
  address: '0xabc',
  chainId: '0x1',
  decimals: 18,
  symbol: 'ETH',
  name: 'Ethereum',
  image: 'eth.svg',
  isNative: false,
  balance: '1.5',
  tokenFiatAmount: 3000,
};

const createStore = () =>
  configureStore({
    reducer: (state = { metamask: { useExternalServices: true } }) => state,
  });

const renderPage = ({
  report = mockReport,
  isLoading = false,
  error = null,
  token = mockToken as unknown,
  params = {
    chainId: 'eip155:1',
    asset: 'eip155:1/erc20:0xabc',
  },
}: {
  report?: MarketInsightsReport | null;
  isLoading?: boolean;
  error?: string | null;
  token?: unknown;
  params?: Record<string, string>;
} = {}) => {
  mockUseParams.mockReturnValue(params);
  mockUseMarketInsights.mockReturnValue({ report, isLoading, error });
  mockUseRouteAssetToken.mockReturnValue({ token });
  mockGetFungibleAssetForRoute.mockReturnValue(null);
  mockUseTheme.mockReturnValue(ThemeType.light);

  return renderWithProvider(<MarketInsightsPage />, createStore());
};

describe('MarketInsightsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockOpen.mockClear();
    jest.spyOn(globalThis, 'open').mockImplementation(mockOpen);
    mockUseParams.mockReturnValue({
      chainId: 'eip155:1',
      asset: 'eip155:1/erc20:0xabc',
    });
  });

  describe('rendering', () => {
    it('renders the report content when the report is loaded', () => {
      const { getByTestId, getByText } = renderPage();

      expect(getByTestId('market-insights-view-container')).toBeInTheDocument();
      expect(getByTestId('market-insights-headline')).toHaveTextContent(
        'Ethereum trends upward',
      );
      expect(getByTestId('market-insights-summary')).toHaveTextContent(
        'Ethereum is trending upward on strong volume.',
      );
      expect(getByTestId('market-insights-trend-item')).toBeInTheDocument();
      expect(getByTestId('market-insights-whats-being-said')).toHaveTextContent(
        en.marketInsightsWhatsBeingSaid.message,
      );
      expect(getByTestId('market-insights-tweet-card')).toBeInTheDocument();
      expect(getByTestId('market-insights-sources-footer')).toHaveTextContent(
        en.marketInsightsHelpfulPrompt.message,
      );
    });

    it('renders the sticky footer actions when the token resolves', () => {
      const { getByTestId } = renderPage();

      const stickyActions = getByTestId('market-insights-sticky-actions');
      expect(stickyActions).toBeInTheDocument();
      expect(stickyActions).toHaveAttribute('data-symbol', 'ETH');
    });

    it('omits the sticky footer actions when the token is unavailable', () => {
      const { queryByTestId } = renderPage({ token: null });

      expect(
        queryByTestId('market-insights-sticky-actions'),
      ).not.toBeInTheDocument();
    });

    it('hides the what is being said section when there are no tweets', () => {
      const report: MarketInsightsReport = {
        ...mockReport,
        trends: [
          {
            ...mockReport.trends[0],
            tweets: [],
          },
        ],
      };

      const { queryByTestId } = renderPage({ report });

      expect(
        queryByTestId('market-insights-whats-being-said'),
      ).not.toBeInTheDocument();
    });

    it('requests insights for the routed asset', () => {
      renderPage();

      expect(mockUseMarketInsights).toHaveBeenCalledWith(assetId, true);
    });

    it('wires the view tracking hook to the asset, report, and source', () => {
      renderPage();

      expect(mockUseMarketInsightsViewTracking).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId,
          report: mockReport,
          source: 'token_details',
        }),
      );
    });
  });

  describe('loading', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('renders the header but no skeleton before the skeleton delay while loading', () => {
      const { queryByTestId } = renderPage({
        report: null,
        isLoading: true,
      });

      expect(
        queryByTestId('market-insights-view-container'),
      ).toBeInTheDocument();
      expect(queryByTestId('market-insights-back-button')).toBeInTheDocument();
      expect(
        queryByTestId('market-insights-view-skeleton'),
      ).not.toBeInTheDocument();
    });

    it('renders the view skeleton after the skeleton delay', () => {
      jest.useFakeTimers();
      const { getByTestId } = renderPage({
        report: null,
        isLoading: true,
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(getByTestId('market-insights-view-skeleton')).toBeInTheDocument();
    });
  });

  describe('redirects', () => {
    it('redirects to the asset page when loaded with no report', () => {
      renderPage({ report: null, isLoading: false });

      expect(mockNavigate).toHaveBeenCalledWith(buildAssetRoutePath(assetId), {
        replace: true,
      });
    });

    it('renders the cached report when an error is set alongside it', () => {
      const { getByTestId, queryByTestId } = renderPage({
        error: 'Network error',
      });

      expect(getByTestId('market-insights-view-container')).toBeInTheDocument();
      expect(getByTestId('market-insights-headline')).toBeInTheDocument();
      expect(
        queryByTestId('market-insights-view-skeleton'),
      ).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('redirects to the previous route when the asset is missing', () => {
      renderPage({ params: {} });

      expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });
  });

  describe('back navigation', () => {
    it('tracks closed and navigates back when the back button is pressed', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('market-insights-back-button'));

      expect(mockTrackClosed).toHaveBeenCalledTimes(1);
      expect(mockTransitionBack).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });
  });

  describe('sources modal', () => {
    it('opens the sources modal when a trend is pressed', () => {
      const { getByTestId, queryByTestId } = renderPage();

      expect(
        queryByTestId('market-insights-sources-modal'),
      ).not.toBeInTheDocument();

      fireEvent.click(getByTestId('market-insights-trend-item'));

      expect(getByTestId('market-insights-sources-modal')).toBeInTheDocument();
    });

    it('tracks a source click and opens the URL when an article is pressed', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('market-insights-trend-item'));
      fireEvent.click(getByTestId('market-insights-article-row'));

      expect(mockTrackInteraction).toHaveBeenCalledWith('source_click', {
        sourceUrl: 'https://example.com/ethereum-scales',
      });
      expect(mockOpen).toHaveBeenCalledWith(
        'https://example.com/ethereum-scales',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('ignores presses on unsafe source URLs', () => {
      const report: MarketInsightsReport = {
        ...mockReport,
        trends: [
          {
            ...mockReport.trends[0],
            articles: [
              {
                title: 'Unsafe article',
                url: unsafeUrl,
                source: 'Evil',
                date: fiveHoursAgo(),
              },
            ],
            tweets: [],
          },
        ],
      };

      const { getByTestId } = renderPage({ report });

      fireEvent.click(getByTestId('market-insights-trend-item'));
      fireEvent.click(getByTestId('market-insights-article-row'));

      expect(mockOpen).not.toHaveBeenCalled();
      expect(mockTrackInteraction).not.toHaveBeenCalled();
    });

    it('tracks a source click when a tweet is pressed', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('market-insights-tweet-card'));

      expect(mockTrackInteraction).toHaveBeenCalledWith('source_click', {
        sourceUrl: 'https://x.com/ethanalyst/status/1',
      });
      expect(mockOpen).toHaveBeenCalledWith(
        'https://x.com/ethanalyst/status/1',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('disables tweet cards whose URL is outside x.com and twitter.com', () => {
      const report: MarketInsightsReport = {
        ...mockReport,
        trends: [
          {
            ...mockReport.trends[0],
            articles: [],
            tweets: [
              {
                contentSummary: 'Fake tweet',
                url: 'https://example.com/fake-tweet',
                author: '@someone',
                date: fiveHoursAgo(),
              },
            ],
          },
        ],
      };

      const { getByTestId } = renderPage({ report });

      expect(getByTestId('market-insights-tweet-card')).toBeDisabled();
      expect(mockOpen).not.toHaveBeenCalled();
      expect(mockTrackInteraction).not.toHaveBeenCalled();
    });

    it('does not open the sources modal when the trend has no sources', () => {
      const report: MarketInsightsReport = {
        ...mockReport,
        trends: [
          {
            ...mockReport.trends[0],
            articles: [],
            tweets: [],
          },
        ],
      };

      const { getByTestId, queryByTestId } = renderPage({ report });

      fireEvent.click(getByTestId('market-insights-trend-item'));

      expect(
        queryByTestId('market-insights-sources-modal'),
      ).not.toBeInTheDocument();
    });
  });

  describe('feedback', () => {
    it('tracks thumbs up and shows the submitted toast', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('market-insights-thumbs-up-button'));

      expect(mockTrackInteraction).toHaveBeenCalledWith('thumbs_up');
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    it('shows the filled thumbs up icon after thumbs up is pressed', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('market-insights-thumbs-up-button'));

      const thumbsUp = getByTestId('market-insights-thumbs-up-button');
      const svg = thumbsUp.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('opens the feedback modal when thumbs down is pressed', () => {
      const { getByTestId, queryByTestId } = renderPage();

      expect(
        queryByTestId('market-insights-feedback-modal'),
      ).not.toBeInTheDocument();

      fireEvent.click(getByTestId('market-insights-thumbs-down-button'));

      expect(getByTestId('market-insights-feedback-modal')).toBeInTheDocument();
    });

    it('tracks the feedback submission and closes the modal', () => {
      const { getByTestId, queryByTestId } = renderPage();

      fireEvent.click(getByTestId('market-insights-thumbs-down-button'));
      fireEvent.click(
        getByTestId('market-insights-feedback-option-something-else'),
      );
      fireEvent.change(
        getByTestId('market-insights-feedback-additional-input'),
        { target: { value: 'Add price charts' } },
      );
      fireEvent.click(getByTestId('market-insights-feedback-submit-button'));

      expect(mockTrackInteraction).toHaveBeenCalledWith('thumbs_down', {
        feedbackReason: 'something_else',
        feedbackText: 'Add price charts',
      });
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(
        queryByTestId('market-insights-feedback-modal'),
      ).not.toBeInTheDocument();
    });
  });

  describe('sticky footer actions', () => {
    it('tracks swap when the sticky swap action is pressed', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('mock-swap-button'));

      expect(mockTrackInteraction).toHaveBeenCalledWith('swap');
    });

    it('tracks buy when the sticky buy action is pressed', () => {
      const { getByTestId } = renderPage();

      fireEvent.click(getByTestId('mock-buy-button'));

      expect(mockTrackInteraction).toHaveBeenCalledWith('buy');
    });
  });

  describe('getStickyFooterAsset', () => {
    it('returns null when no token is available', () => {
      expect(getStickyFooterAsset(null)).toBeNull();
      expect(getStickyFooterAsset(undefined)).toBeNull();
    });

    it('maps a native token with a balance to a native sticky asset', () => {
      const asset = getStickyFooterAsset({
        ...(mockToken as unknown as object),
        isNative: true,
      } as unknown as Parameters<typeof getStickyFooterAsset>[0]);

      expect(asset).toMatchObject({
        type: 'NATIVE',
        isOriginalNativeSymbol: true,
        symbol: 'ETH',
        balance: { value: '1.5', display: '1.5', fiat: '3000' },
      });
    });

    it('maps a token without a balance to a sticky asset without balance', () => {
      const { balance: _balance, ...tokenWithoutBalance } =
        mockToken as typeof mockToken & { balance: string };

      const asset = getStickyFooterAsset(
        tokenWithoutBalance as unknown as Parameters<
          typeof getStickyFooterAsset
        >[0],
      );

      expect(asset).toMatchObject({
        type: 'TOKEN',
        address: '0xabc',
        symbol: 'ETH',
      });
      expect(asset).toBeDefined();
      expect((asset as { balance?: unknown }).balance).toBeUndefined();
    });

    it('defaults the balance fiat amount to zero when fiat data is missing', () => {
      const asset = getStickyFooterAsset({
        ...(mockToken as unknown as object),
        tokenFiatAmount: undefined,
      } as unknown as Parameters<typeof getStickyFooterAsset>[0]);

      expect(asset).toMatchObject({
        balance: { value: '1.5', display: '1.5', fiat: '0' },
      });
    });
  });
});
