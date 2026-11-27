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
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type {
  MarketInsightsArticle,
  MarketInsightsTweet,
} from '@metamask/ai-controllers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  formatRelativeTime,
  getNormalizedHandle,
  getOpenableSourceUrl,
} from '../utils/market-insights-formatting';
import { ArticleRow } from './article-row';

export const MARKET_INSIGHTS_SOURCES_MODAL_TEST_ID =
  'market-insights-sources-modal';

type MarketInsightsTrendSourcesModalProps = {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Called when the modal is dismissed. */
  onClose: () => void;
  /** Article rows to render. */
  articles: MarketInsightsArticle[];
  /** Social post rows to render below the articles. */
  tweets?: MarketInsightsTweet[];
  /** Called with an article URL when an article row is pressed. */
  onArticlePress?: (url: string) => void;
  /** Called with a social post URL when a social post row is pressed. */
  onTweetPress?: (url: string) => void;
};

const TweetRow = ({
  tweet,
  onPress,
  isLastItem,
}: {
  tweet: MarketInsightsTweet;
  onPress?: (url: string) => void;
  isLastItem: boolean;
}) => {
  const t = useI18nContext();
  const timeAgo = tweet.date ? formatRelativeTime(tweet.date, t) : null;

  return (
    <button
      type="button"
      className={`w-full cursor-pointer py-3 text-left ${
        isLastItem ? '' : 'border-b border-muted'
      }`}
      onClick={() => onPress?.(tweet.url)}
      disabled={!onPress}
      data-testid="market-insights-tweet-row"
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
            {tweet.contentSummary}
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
          <Box className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <Icon
              name={IconName.X}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
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
              {getNormalizedHandle(tweet.author)}
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

/**
 * Modal listing a trend's source articles and social posts, each opening its
 * original URL.
 *
 * @param props - Component props.
 * @param props.isOpen - Whether the modal is open.
 * @param props.onClose - Called when the modal is dismissed.
 * @param props.articles - Article rows to render.
 * @param props.tweets - Social post rows to render below the articles.
 * @param props.onArticlePress - Called with an article URL when an article row
 * is pressed.
 * @param props.onTweetPress - Called with a social post URL when a social post
 * row is pressed.
 * @returns The sources modal.
 */
export const MarketInsightsTrendSourcesModal = ({
  isOpen,
  onClose,
  articles,
  tweets = [],
  onArticlePress,
  onTweetPress,
}: MarketInsightsTrendSourcesModalProps) => {
  const t = useI18nContext();

  const handleArticlePress = useCallback(
    (url: string) => {
      onArticlePress?.(url);
    },
    [onArticlePress],
  );

  const handleTweetPress = useCallback(
    (url: string) => {
      onTweetPress?.(url);
    },
    [onTweetPress],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid={MARKET_INSIGHTS_SOURCES_MODAL_TEST_ID}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') as string }}
        >
          <Text variant={TextVariant.HeadingSm}>
            {t('marketInsightsSourcesTitle')}
          </Text>
        </ModalHeader>
        <ModalBody className="max-h-[440px] overflow-y-auto px-4">
          <Box paddingBottom={4}>
            {articles.map((article, index) => {
              const isLastItem =
                index === articles.length - 1 && tweets.length === 0;
              return (
                <ArticleRow
                  key={`${article.url}-${index}`}
                  article={article}
                  onPress={
                    getOpenableSourceUrl(article.url, 'article')
                      ? handleArticlePress
                      : undefined
                  }
                  isLastItem={isLastItem}
                />
              );
            })}

            {tweets.map((tweet, index) => (
              <TweetRow
                key={`${tweet.url}-${index}`}
                tweet={tweet}
                onPress={
                  getOpenableSourceUrl(tweet.url, 'tweet')
                    ? handleTweetPress
                    : undefined
                }
                isLastItem={index === tweets.length - 1}
              />
            ))}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
