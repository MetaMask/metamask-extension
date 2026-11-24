import React, { useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type {
  MarketInsightsSource,
  MarketInsightsTrend,
} from '@metamask/ai-controllers';
import { getUniqueSourcesByFavicon } from '../utils/market-insights-formatting';
import { SourceLogoGroup } from './source-logo-group';

export const MARKET_INSIGHTS_TREND_ITEM_TEST_ID = 'market-insights-trend-item';

type MarketInsightsTrendItemProps = {
  /** The trend to render. */
  trend: MarketInsightsTrend;
  /** Opens the trend's sources when pressed, when it has any. */
  onPress?: (trend: MarketInsightsTrend) => void;
};

/**
 * A single market trend row: title, description, and a stacked row of up to
 * three source logos with a "name +N" label.
 *
 * @param props - Component props.
 * @param props.trend - The trend to render.
 * @param props.onPress - Called when the row is pressed.
 * @returns The trend row.
 */
export const MarketInsightsTrendItem = ({
  trend,
  onPress,
}: MarketInsightsTrendItemProps) => {
  const uniqueSources = useMemo(() => {
    const articleSources: MarketInsightsSource[] = trend.articles.map(
      (article) => ({
        name: article.source,
        type: 'news',
        url: article.url || article.source,
      }),
    );
    const tweetSources: MarketInsightsSource[] = (trend.tweets ?? []).map(
      (tweet) => ({
        name: 'X',
        type: 'social',
        url: tweet.url || 'https://x.com',
      }),
    );

    return getUniqueSourcesByFavicon([...articleSources, ...tweetSources]);
  }, [trend.articles, trend.tweets]);

  const firstSource = uniqueSources[0];
  const remainingCount = Math.max(0, uniqueSources.length - 1);
  const sourceLabel = (() => {
    if (!firstSource) {
      return null;
    }
    if (firstSource.name === 'X' && remainingCount === 0) {
      return null;
    }
    return remainingCount > 0
      ? `${firstSource.name} +${remainingCount}`
      : firstSource.name;
  })();

  const isPressable = Boolean(onPress);

  return (
    <button
      type="button"
      className={`w-full cursor-pointer px-4 py-3 text-left ${
        isPressable ? '' : 'cursor-default'
      }`}
      onClick={() => onPress?.(trend)}
      disabled={!isPressable}
      data-testid={MARKET_INSIGHTS_TREND_ITEM_TEST_ID}
      aria-label={trend.title}
    >
      <Text variant={TextVariant.HeadingSm} className="mb-2">
        {trend.title}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {trend.description}
      </Text>
      {uniqueSources.length > 0 ? (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="pt-2 gap-2"
        >
          <SourceLogoGroup sources={uniqueSources} />
          {sourceLabel ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {sourceLabel}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </button>
  );
};
