import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { MarketInsightsTweet } from '@metamask/ai-controllers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  formatRelativeTime,
  getNormalizedHandle,
} from '../utils/market-insights-formatting';

export const MARKET_INSIGHTS_TWEET_CARD_TEST_ID = 'market-insights-tweet-card';

type MarketInsightsTweetCardProps = {
  /** The tweet to render. */
  tweet: MarketInsightsTweet;
  /** Opens the tweet URL when pressed. */
  onPress?: (url: string) => void;
};

/**
 * A rounded card summarizing one social post, with the author handle, relative
 * age, and an X icon.
 *
 * @param props - Component props.
 * @param props.tweet - The tweet to render.
 * @param props.onPress - Called with the tweet URL when the card is pressed.
 * @returns The tweet card.
 */
export const MarketInsightsTweetCard = ({
  tweet,
  onPress,
}: MarketInsightsTweetCardProps) => {
  const t = useI18nContext();
  const timeAgo = tweet.date ? formatRelativeTime(tweet.date, t) : null;

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded-2xl bg-muted p-4 text-left"
      onClick={() => onPress?.(tweet.url)}
      disabled={!onPress}
      data-testid={MARKET_INSIGHTS_TWEET_CARD_TEST_ID}
    >
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextDefault}
        className="mb-3"
      >
        {tweet.contentSummary}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="flex-1"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {getNormalizedHandle(tweet.author)}
          </Text>
          {timeAgo ? (
            <>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {'•'}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {timeAgo}
              </Text>
            </>
          ) : null}
        </Box>
        <Icon
          name={IconName.X}
          size={IconSize.Sm}
          color={IconColor.IconDefault}
        />
      </Box>
    </button>
  );
};
