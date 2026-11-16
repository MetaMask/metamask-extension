import React, { useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { MarketInsightsArticle } from '@metamask/ai-controllers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  formatRelativeTime,
  getFaviconUrl,
} from '../utils/market-insights-formatting';

export const MARKET_INSIGHTS_ARTICLE_ROW_TEST_ID =
  'market-insights-article-row';

type ArticleRowProps = {
  /** The article to render. */
  article: MarketInsightsArticle;
  /** Opens the article URL when pressed. */
  onPress?: (url: string) => void;
  /** Hides the bottom divider on the last row. */
  isLastItem?: boolean;
};

/**
 * A single article row inside the sources modal: title, export icon, favicon,
 * source name, and relative date.
 *
 * @param props - Component props.
 * @param props.article - The article to render.
 * @param props.onPress - Called with the article URL when pressed.
 * @param props.isLastItem - Whether this is the final row in the list.
 * @returns The article row.
 */
export const ArticleRow = ({
  article,
  onPress,
  isLastItem,
}: ArticleRowProps) => {
  const t = useI18nContext();

  const handlePress = useCallback(() => {
    onPress?.(article.url);
  }, [onPress, article.url]);

  const timeAgo = article.date ? formatRelativeTime(article.date, t) : null;

  return (
    <button
      type="button"
      className={`w-full cursor-pointer py-3 text-left ${
        isLastItem ? '' : 'border-b border-muted'
      }`}
      onClick={handlePress}
      disabled={!onPress}
      data-testid={MARKET_INSIGHTS_ARTICLE_ROW_TEST_ID}
    >
      <Box className="flex-1">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Start}
          className="pr-1"
        >
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            className="flex-1 pr-2"
          >
            {article.title}
          </Text>
          <Box paddingTop={1}>
            <Icon
              name={IconName.ArrowSquareOut}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
            />
          </Box>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="pt-3"
        >
          <Box className="mr-2 h-4 w-4 overflow-hidden rounded-full">
            <img
              src={getFaviconUrl(article.url || article.source)}
              alt=""
              className="h-4 w-4 rounded-full"
            />
          </Box>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              {article.source}
            </Text>
            {timeAgo ? (
              <>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {'•'}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {timeAgo}
                </Text>
              </>
            ) : null}
          </Box>
        </Box>
      </Box>
    </button>
  );
};
