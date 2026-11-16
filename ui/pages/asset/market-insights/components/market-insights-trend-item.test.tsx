import React from 'react';
import { fireEvent } from '@testing-library/react';
import type { MarketInsightsTrend } from '@metamask/ai-controllers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  MarketInsightsTrendItem,
  MARKET_INSIGHTS_TREND_ITEM_TEST_ID,
} from './market-insights-trend-item';

const makeTrend = (
  overrides: Partial<MarketInsightsTrend> = {},
): MarketInsightsTrend => ({
  title: 'Bullish momentum',
  description: 'Bullish momentum continues',
  category: 'technical',
  impact: 'positive',
  articles: [
    {
      title: 'Article one',
      url: 'https://example.com/one',
      source: 'Example',
      date: '2024-01-01T00:00:00Z',
    },
    {
      title: 'Article two',
      url: 'https://another.com/two',
      source: 'Another',
      date: '2024-01-01T00:00:00Z',
    },
  ],
  tweets: [],
  ...overrides,
});

describe('MarketInsightsTrendItem', () => {
  it('renders the trend title and description', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MarketInsightsTrendItem trend={makeTrend()} />,
    );

    expect(getByTestId(MARKET_INSIGHTS_TREND_ITEM_TEST_ID)).toBeInTheDocument();
    expect(getByText('Bullish momentum')).toBeInTheDocument();
    expect(getByText('Bullish momentum continues')).toBeInTheDocument();
  });

  it('renders a source label with the remaining source count', () => {
    const { getByText } = renderWithProvider(
      <MarketInsightsTrendItem trend={makeTrend()} />,
    );

    expect(getByText('Example +1')).toBeInTheDocument();
  });

  it('renders the single source name without a count', () => {
    const trend = makeTrend({
      articles: [
        {
          title: 'Article one',
          url: 'https://example.com/one',
          source: 'Example',
          date: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const { getByText } = renderWithProvider(
      <MarketInsightsTrendItem trend={trend} />,
    );

    expect(getByText('Example')).toBeInTheDocument();
  });

  it('omits the source label when the only source is X', () => {
    const trend = makeTrend({
      articles: [],
      tweets: [
        {
          contentSummary: 'Summary',
          url: 'https://x.com/a/status/1',
          author: '@a',
          date: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const { container, queryByText } = renderWithProvider(
      <MarketInsightsTrendItem trend={trend} />,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(queryByText('X')).not.toBeInTheDocument();
  });

  it('calls onPress with the trend when pressed', () => {
    const onPress = jest.fn();
    const trend = makeTrend();
    const { getByTestId } = renderWithProvider(
      <MarketInsightsTrendItem trend={trend} onPress={onPress} />,
    );

    fireEvent.click(getByTestId(MARKET_INSIGHTS_TREND_ITEM_TEST_ID));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(trend);
  });

  it('is disabled without an onPress handler', () => {
    const { getByTestId } = renderWithProvider(
      <MarketInsightsTrendItem trend={makeTrend()} />,
    );

    expect(getByTestId(MARKET_INSIGHTS_TREND_ITEM_TEST_ID)).toBeDisabled();
  });
});
