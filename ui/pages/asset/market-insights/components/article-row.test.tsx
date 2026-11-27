import React from 'react';
import { fireEvent } from '@testing-library/react';
import type { MarketInsightsArticle } from '@metamask/ai-controllers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { ArticleRow, MARKET_INSIGHTS_ARTICLE_ROW_TEST_ID } from './article-row';

const mockArticle: MarketInsightsArticle = {
  title: 'Ethereum scales with new upgrade',
  url: 'https://example.com/ethereum-scales',
  source: 'Example News',
  date: '2024-01-01T00:00:00Z',
};

describe('ArticleRow', () => {
  it('renders the article title and source name', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <ArticleRow article={mockArticle} onPress={jest.fn()} />,
    );

    expect(
      getByTestId(MARKET_INSIGHTS_ARTICLE_ROW_TEST_ID),
    ).toBeInTheDocument();
    expect(getByText('Ethereum scales with new upgrade')).toBeInTheDocument();
    expect(getByText('Example News')).toBeInTheDocument();
  });

  it('calls onPress with the article URL when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProvider(
      <ArticleRow article={mockArticle} onPress={onPress} />,
    );

    fireEvent.click(getByTestId(MARKET_INSIGHTS_ARTICLE_ROW_TEST_ID));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(mockArticle.url);
  });

  it('renders a relative date when the article has one', () => {
    const date = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const { getByText } = renderWithProvider(
      <ArticleRow article={{ ...mockArticle, date }} onPress={jest.fn()} />,
    );

    expect(getByText('5h ago')).toBeInTheDocument();
  });

  it('omits the relative date when the article has none', () => {
    const article = {
      ...mockArticle,
      date: undefined,
    } as unknown as MarketInsightsArticle;
    const { queryByText } = renderWithProvider(
      <ArticleRow article={article} onPress={jest.fn()} />,
    );

    expect(queryByText('•')).not.toBeInTheDocument();
  });
});
