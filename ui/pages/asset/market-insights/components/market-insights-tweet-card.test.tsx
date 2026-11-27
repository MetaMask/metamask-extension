import React from 'react';
import { fireEvent } from '@testing-library/react';
import type { MarketInsightsTweet } from '@metamask/ai-controllers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  MarketInsightsTweetCard,
  MARKET_INSIGHTS_TWEET_CARD_TEST_ID,
} from './market-insights-tweet-card';

const mockTweet: MarketInsightsTweet = {
  contentSummary: 'Ethereum ETF inflows hit a new record this week.',
  url: 'https://x.com/ethanalyst/status/1',
  author: '@ethanalyst',
  date: '2024-01-01T00:00:00Z',
};

describe('MarketInsightsTweetCard', () => {
  it('renders the tweet summary and author handle', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MarketInsightsTweetCard tweet={mockTweet} onPress={jest.fn()} />,
    );

    expect(getByTestId(MARKET_INSIGHTS_TWEET_CARD_TEST_ID)).toBeInTheDocument();
    expect(
      getByText('Ethereum ETF inflows hit a new record this week.'),
    ).toBeInTheDocument();
    expect(getByText('@ethanalyst')).toBeInTheDocument();
  });

  it('calls onPress with the tweet URL when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProvider(
      <MarketInsightsTweetCard tweet={mockTweet} onPress={onPress} />,
    );

    fireEvent.click(getByTestId(MARKET_INSIGHTS_TWEET_CARD_TEST_ID));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(mockTweet.url);
  });

  it('is disabled without an onPress handler', () => {
    const { getByTestId } = renderWithProvider(
      <MarketInsightsTweetCard tweet={mockTweet} />,
    );

    expect(getByTestId(MARKET_INSIGHTS_TWEET_CARD_TEST_ID)).toBeDisabled();
  });

  it('renders the handle without a date bullet when the date is missing', () => {
    const { getByText, queryByText, getByTestId } = renderWithProvider(
      <MarketInsightsTweetCard
        tweet={
          { ...mockTweet, date: undefined } as unknown as MarketInsightsTweet
        }
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId(MARKET_INSIGHTS_TWEET_CARD_TEST_ID)).toBeInTheDocument();
    expect(getByText('@ethanalyst')).toBeInTheDocument();
    expect(queryByText('•')).not.toBeInTheDocument();
  });
});
