import React from 'react';
import { fireEvent } from '@testing-library/react';
import type {
  MarketInsightsArticle,
  MarketInsightsTweet,
} from '@metamask/ai-controllers';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import {
  MarketInsightsTrendSourcesModal,
  MARKET_INSIGHTS_SOURCES_MODAL_TEST_ID,
} from './market-insights-trend-sources-modal';

const en = enLocale as unknown as Record<string, { message: string }>;
const sourcesTitleMessage = en.marketInsightsSourcesTitle.message;

const mockArticles: MarketInsightsArticle[] = [
  {
    title: 'Ethereum scales with new upgrade',
    url: 'https://example.com/ethereum-scales',
    source: 'Example News',
    date: '2024-01-01T00:00:00Z',
  },
];

const mockTweets: MarketInsightsTweet[] = [
  {
    contentSummary: 'Bullish on ETH long term.',
    url: 'https://x.com/ethanalyst/status/1',
    author: '@ethanalyst',
    date: '2024-01-01T00:00:00Z',
  },
];

const renderModal = ({
  isOpen = true,
  articles = mockArticles,
  tweets = mockTweets,
  onArticlePress = jest.fn(),
  onTweetPress = jest.fn(),
  onClose = jest.fn(),
}: {
  isOpen?: boolean;
  articles?: MarketInsightsArticle[];
  tweets?: MarketInsightsTweet[];
  onArticlePress?: (url: string) => void;
  onTweetPress?: (url: string) => void;
  onClose?: () => void;
} = {}) =>
  renderWithProvider(
    <MarketInsightsTrendSourcesModal
      isOpen={isOpen}
      articles={articles}
      tweets={tweets}
      onArticlePress={onArticlePress}
      onTweetPress={onTweetPress}
      onClose={onClose}
    />,
  );

describe('MarketInsightsTrendSourcesModal', () => {
  it('renders the modal with its title when open', () => {
    const { getByText, getByTestId } = renderModal();

    expect(
      getByTestId(MARKET_INSIGHTS_SOURCES_MODAL_TEST_ID),
    ).toBeInTheDocument();
    expect(getByText(sourcesTitleMessage)).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { queryByTestId } = renderModal({ isOpen: false });

    expect(
      queryByTestId(MARKET_INSIGHTS_SOURCES_MODAL_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders article rows and tweet rows', () => {
    const { getByText, getByTestId } = renderModal();

    expect(getByText('Ethereum scales with new upgrade')).toBeInTheDocument();
    expect(getByText('Bullish on ETH long term.')).toBeInTheDocument();
    expect(getByTestId('market-insights-article-row')).toBeInTheDocument();
    expect(getByTestId('market-insights-tweet-row')).toBeInTheDocument();
  });

  it('calls onArticlePress with the article URL when an article is pressed', () => {
    const onArticlePress = jest.fn();
    const { getByTestId } = renderModal({ onArticlePress });

    fireEvent.click(getByTestId('market-insights-article-row'));

    expect(onArticlePress).toHaveBeenCalledWith(
      'https://example.com/ethereum-scales',
    );
  });

  it('calls onTweetPress with the tweet URL when a tweet is pressed', () => {
    const onTweetPress = jest.fn();
    const { getByTestId } = renderModal({ onTweetPress });

    fireEvent.click(getByTestId('market-insights-tweet-row'));

    expect(onTweetPress).toHaveBeenCalledWith(
      'https://x.com/ethanalyst/status/1',
    );
  });
});
