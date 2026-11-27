import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { MarketInsightsTrend } from '@metamask/ai-controllers';
import type { Hex } from '@metamask/utils';

import { ThemeType } from '../../../../shared/constants/preferences';
import { AssetType } from '../../../../shared/constants/transaction';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import { MARKET_INSIGHTS_EVENT_VALUE } from '../../../../shared/constants/market-insights-events';
import { ToastContent, toast } from '../../../components/ui/toast/toast';
import { transitionBack } from '../../../components/ui/transition';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { getFungibleAssetForRoute } from '../../../selectors/assets';
import { AssetStickyActions } from '../components/asset-sticky-actions';
import { useMarketInsights } from '../hooks/useMarketInsights';
import {
  useRouteAssetToken,
  type RouteAssetToken,
} from '../hooks/useRouteAssetToken';
import type { Asset } from '../types/asset';
import { processAssetParams, resolveAssetRouteLookup } from '../util';
import { MarketInsightsFeedbackModal } from './components/market-insights-feedback-modal';
import type { MarketInsightsFeedbackSubmitPayload } from './components/market-insights-feedback-modal';
import { MarketInsightsPageHeader } from './components/market-insights-page-header';
import { MarketInsightsTrendItem } from './components/market-insights-trend-item';
import { MarketInsightsTrendSourcesModal } from './components/market-insights-trend-sources-modal';
import { MarketInsightsTweetCard } from './components/market-insights-tweet-card';
import { MarketInsightsViewSkeleton } from './components/market-insights-view-skeleton';
import { getOpenableSourceUrl } from './utils/market-insights-formatting';
import { useMarketInsightsViewTracking } from './useMarketInsightsViewTracking';

const MARKET_INSIGHTS_VIEW_TEST_ID = 'market-insights-view-container';
const MARKET_INSIGHTS_SOURCES_FOOTER_TEST_ID = 'market-insights-sources-footer';
const MARKET_INSIGHTS_THUMBS_UP_TEST_ID = 'market-insights-thumbs-up-button';
const MARKET_INSIGHTS_THUMBS_DOWN_TEST_ID =
  'market-insights-thumbs-down-button';
const MARKET_INSIGHTS_HEADLINE_TEST_ID = 'market-insights-headline';
const MARKET_INSIGHTS_SUMMARY_TEST_ID = 'market-insights-summary';
const MARKET_INSIGHTS_WHATS_BEING_SAID_TEST_ID =
  'market-insights-whats-being-said';

const SKELETON_DELAY_MS = 150;

type FeedbackChoice = 'up' | 'down';
const HERO_IMAGE_BY_THEME = {
  [ThemeType.dark]:
    'images/market-insights/market-insights-background-dark-last-frame.png',
  [ThemeType.light]:
    'images/market-insights/market-insights-background-light-last-frame.png',
} as const;

/**
 * Shows a toast confirming that insight feedback was recorded.
 *
 * @param title - Toast title.
 */
const showFeedbackSubmittedToast = (title: string) => {
  toast.success(<ToastContent title={title} />, {
    id: 'market-insights-feedback-toast',
    icon: <Icon name={IconName.Check} color={IconColor.IconDefault} />,
  });
};

/**
 * Builds the asset consumed by the sticky Swap/Buy footer from the token
 * resolved for this route, when one is available.
 *
 * @param token - Token resolved from the route and account group, if any.
 * @returns The sticky footer asset, or null when the token is unavailable.
 */
export const getStickyFooterAsset = (
  token: RouteAssetToken | null | undefined,
): Asset | null => {
  if (!token) {
    return null;
  }

  const tokenBalance =
    'balance' in token && typeof token.balance === 'string'
      ? token.balance
      : undefined;
  const hasBalance = tokenBalance !== undefined && tokenBalance !== '';

  const tokenFiatAmount =
    'tokenFiatAmount' in token ? token.tokenFiatAmount : undefined;
  const fiatAmount =
    tokenFiatAmount !== null && tokenFiatAmount !== undefined
      ? String(tokenFiatAmount)
      : undefined;

  const balance = hasBalance
    ? {
        value: tokenBalance,
        display: tokenBalance,
        fiat: fiatAmount ?? '0',
      }
    : undefined;

  return token.isNative
    ? {
        type: AssetType.native,
        isOriginalNativeSymbol: true,
        chainId: token.chainId as Hex,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
        image: token.image ?? '',
        ...(balance ? { balance } : {}),
      }
    : {
        type: AssetType.token,
        address: token.address,
        aggregators: 'aggregators' in token ? token.aggregators : undefined,
        chainId: token.chainId as Hex,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
        image: token.image ?? '',
        ...(balance ? { balance } : {}),
      };
};

const MarketInsightsPage = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams();

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedTrend, setSelectedTrend] =
    useState<MarketInsightsTrend | null>(null);
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackChoice | null>(
    null,
  );

  const { assetId, chainId, decodedAsset } = resolveAssetRouteLookup(
    processAssetParams(params),
  );

  const ownedToken = useSelector((state) =>
    getFungibleAssetForRoute(state, { assetId, chainId, decodedAsset }),
  );
  const { token } = useRouteAssetToken({ ownedToken, assetId });

  const { report, isLoading, error } = useMarketInsights(
    assetId,
    Boolean(assetId),
  );

  const { trackInteraction, trackClosed } = useMarketInsightsViewTracking({
    assetId,
    report,
    source: MARKET_INSIGHTS_EVENT_VALUE.SOURCE.TOKEN_DETAILS,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoadingSkeleton(true);
    }, SKELETON_DELAY_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    document.querySelector('.app')?.scroll(0, 0);
  }, []);

  useEffect(() => {
    if (assetId) {
      return;
    }
    navigate(PREVIOUS_ROUTE);
  }, [assetId, navigate]);

  useEffect(() => {
    if (assetId && !isLoading && !report) {
      navigate(buildAssetRoutePath(assetId), { replace: true });
    }
  }, [assetId, isLoading, report, navigate]);

  const stickyFooterAsset = useMemo(() => getStickyFooterAsset(token), [token]);

  const handleBackPress = useCallback(() => {
    trackClosed();
    transitionBack(() => navigate(PREVIOUS_ROUTE));
  }, [navigate, trackClosed]);

  const handleSourcePress = useCallback(
    (url: string) => {
      if (!getOpenableSourceUrl(url, 'article')) {
        return;
      }
      trackInteraction('source_click', { sourceUrl: url });
      setSelectedTrend(null);
      globalThis.open(url, '_blank', 'noopener,noreferrer');
    },
    [trackInteraction],
  );

  const handleTweetPress = useCallback(
    (url: string) => {
      if (getOpenableSourceUrl(url, 'tweet')) {
        handleSourcePress(url);
      }
    },
    [handleSourcePress],
  );

  const handleTrendPress = useCallback((trend: MarketInsightsTrend) => {
    setSelectedTrend(trend);
  }, []);

  const handleThumbsUpPress = useCallback(() => {
    setFeedbackGiven('up');
    trackInteraction('thumbs_up');
    showFeedbackSubmittedToast(t('marketInsightsFeedbackSubmitted') as string);
  }, [t, trackInteraction]);

  const handleThumbsDownPress = useCallback(() => {
    setIsFeedbackModalOpen(true);
  }, []);

  const handleFeedbackSubmit = useCallback(
    (payload: MarketInsightsFeedbackSubmitPayload) => {
      setFeedbackGiven('down');
      trackInteraction('thumbs_down', {
        feedbackReason: payload.reason,
        feedbackText: payload.feedbackText,
      });
      setIsFeedbackModalOpen(false);
      showFeedbackSubmittedToast(
        t('marketInsightsFeedbackSubmitted') as string,
      );
    },
    [t, trackInteraction],
  );

  const allTweets = useMemo(
    () => (report?.trends ?? []).flatMap((trend) => trend.tweets ?? []),
    [report],
  );

  if (!assetId) {
    return null;
  }

  const showSkeleton = showLoadingSkeleton && !report && !error;
  const isReportReady = Boolean(report);

  let pageContent: React.ReactNode = null;
  if (showSkeleton) {
    pageContent = <MarketInsightsViewSkeleton />;
  } else if (isReportReady && report) {
    pageContent = (
      <>
        <img
          src={HERO_IMAGE_BY_THEME[theme]}
          alt=""
          className="w-full object-cover"
          style={{ aspectRatio: '786 / 340' }}
        />

        <Box className="px-4 pb-3 pt-4">
          <Text
            variant={TextVariant.HeadingMd}
            color={TextColor.TextDefault}
            data-testid={MARKET_INSIGHTS_HEADLINE_TEST_ID}
          >
            {report.headline}
          </Text>
        </Box>

        <Box className="px-4 pb-3">
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid={MARKET_INSIGHTS_SUMMARY_TEST_ID}
          >
            {report.summary}
          </Text>
        </Box>

        <Box className="pb-6">
          {report.trends.map((trend, index) => (
            <MarketInsightsTrendItem
              key={`trend-${index}`}
              trend={trend}
              onPress={
                trend.articles.length > 0 || (trend.tweets?.length ?? 0) > 0
                  ? handleTrendPress
                  : undefined
              }
            />
          ))}
        </Box>

        {stickyFooterAsset ? (
          <Box alignItems={BoxAlignItems.Center} className="px-4 pb-6">
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('marketInsightsFooterDisclaimer')}
            </Text>
          </Box>
        ) : null}

        {allTweets.length > 0 ? (
          <Box className="pb-6">
            <Box className="h-4 border-t border-muted" />
            <Box
              className="px-4 py-4"
              data-testid={MARKET_INSIGHTS_WHATS_BEING_SAID_TEST_ID}
            >
              <Text
                variant={TextVariant.HeadingMd}
                color={TextColor.TextDefault}
              >
                {t('marketInsightsWhatsBeingSaid')}
              </Text>
            </Box>

            <Box className="flex flex-col gap-3 px-4">
              {allTweets.map((tweet, index) => (
                <MarketInsightsTweetCard
                  key={`tweet-${index}`}
                  tweet={tweet}
                  onPress={
                    getOpenableSourceUrl(tweet.url, 'tweet')
                      ? handleTweetPress
                      : undefined
                  }
                />
              ))}
            </Box>
          </Box>
        ) : null}

        <Box
          alignItems={BoxAlignItems.Center}
          className="border-t border-muted px-4 pt-4"
          data-testid={MARKET_INSIGHTS_SOURCES_FOOTER_TEST_ID}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            <ButtonIcon
              ariaLabel={t('marketInsightsThumbsUpAriaLabel') as string}
              color={
                feedbackGiven === 'up'
                  ? IconColor.IconDefault
                  : IconColor.IconAlternative
              }
              size={ButtonIconSize.Md}
              iconName={
                feedbackGiven === 'up'
                  ? IconName.ThumbUpFilled
                  : IconName.ThumbUp
              }
              onClick={handleThumbsUpPress}
              data-testid={MARKET_INSIGHTS_THUMBS_UP_TEST_ID}
              className="h-12 w-12"
            />
            <ButtonIcon
              ariaLabel={t('marketInsightsThumbsDownAriaLabel') as string}
              color={
                feedbackGiven === 'down'
                  ? IconColor.IconDefault
                  : IconColor.IconAlternative
              }
              size={ButtonIconSize.Md}
              iconName={
                feedbackGiven === 'down'
                  ? IconName.ThumbDownFilled
                  : IconName.ThumbDown
              }
              onClick={handleThumbsDownPress}
              data-testid={MARKET_INSIGHTS_THUMBS_DOWN_TEST_ID}
              className="h-12 w-12"
            />
          </Box>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="pt-1"
          >
            {t('marketInsightsHelpfulPrompt')}
          </Text>
        </Box>

        {stickyFooterAsset ? (
          <AssetStickyActions
            asset={stickyFooterAsset}
            buyAssetId={assetId}
            onSwapPress={() => trackInteraction('swap')}
            onBuyPress={() => trackInteraction('buy')}
          />
        ) : null}

        <MarketInsightsTrendSourcesModal
          isOpen={selectedTrend !== null}
          articles={selectedTrend?.articles ?? []}
          tweets={selectedTrend?.tweets}
          onArticlePress={handleSourcePress}
          onTweetPress={handleTweetPress}
          onClose={() => setSelectedTrend(null)}
        />

        {isFeedbackModalOpen ? (
          <MarketInsightsFeedbackModal
            onClose={() => setIsFeedbackModalOpen(false)}
            onSubmit={handleFeedbackSubmit}
          />
        ) : null}
      </>
    );
  }

  return (
    <ScrollContainer
      className="main-container asset__container"
      data-testid="market-insights-page-scroll-container"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        data-testid={MARKET_INSIGHTS_VIEW_TEST_ID}
        className="asset__content flex min-h-full flex-col"
      >
        <MarketInsightsPageHeader onBackPress={handleBackPress} />
        {pageContent}
      </Box>
    </ScrollContainer>
  );
};

export default MarketInsightsPage;
