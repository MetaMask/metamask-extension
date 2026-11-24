import React from 'react';
import { fireEvent } from '@testing-library/react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import { MarketInsightsEntryCard } from './market-insights-entry-card';

const en = enLocale as unknown as Record<string, { message: string }>;
const titleMessage = en.marketInsightsTitle.message;
const footerMessage = en.marketInsightsFooterDisclaimer.message;

const mockReport: MarketInsightsReport = {
  digestId: 'digest-1',
  asset: 'eth',
  generatedAt: '2024-01-01T00:00:00Z',
  headline: 'Ethereum trends upward',
  summary: 'Ethereum is trending upward on strong volume.',
  trends: [
    {
      title: 'Bullish momentum',
      description: 'Bullish momentum continues',
      category: 'technical',
      impact: 'positive',
      articles: [],
      tweets: [],
    },
    {
      title: 'Whale accumulation',
      description: 'Whale accumulation detected',
      category: 'other',
      impact: 'neutral',
      articles: [],
      tweets: [],
    },
  ],
  sources: [],
};

describe('MarketInsightsEntryCard', () => {
  it('renders the title, trend texts, and footer disclaimer', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MarketInsightsEntryCard
        report={mockReport}
        timeAgo="5d ago"
        onDisclaimerPress={jest.fn()}
      />,
    );

    expect(getByText(titleMessage)).toBeInTheDocument();
    expect(getByText('Bullish momentum continues')).toBeInTheDocument();
    expect(getByTestId('market-insights-entry-card')).toBeInTheDocument();
    expect(getByText(`${footerMessage} • 5d ago`)).toBeInTheDocument();
  });

  it('falls back to the summary when there are no trend descriptions', () => {
    const { getByText } = renderWithProvider(
      <MarketInsightsEntryCard
        report={{ ...mockReport, trends: [] }}
        timeAgo="5d ago"
        onDisclaimerPress={jest.fn()}
      />,
    );

    expect(
      getByText('Ethereum is trending upward on strong volume.'),
    ).toBeInTheDocument();
  });

  it('calls onPress when the card is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProvider(
      <MarketInsightsEntryCard
        report={mockReport}
        timeAgo="5d ago"
        onPress={onPress}
        onDisclaimerPress={jest.fn()}
      />,
    );

    fireEvent.click(getByTestId('market-insights-entry-card-button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onDisclaimerPress when the info button is pressed', () => {
    const onDisclaimerPress = jest.fn();
    const { getByTestId } = renderWithProvider(
      <MarketInsightsEntryCard
        report={mockReport}
        timeAgo="5d ago"
        onPress={jest.fn()}
        onDisclaimerPress={onDisclaimerPress}
      />,
    );

    fireEvent.click(getByTestId('market-insights-info-button'));

    expect(onDisclaimerPress).toHaveBeenCalledTimes(1);
  });

  it('does not render the press overlay without an onPress handler', () => {
    const { queryByTestId } = renderWithProvider(
      <MarketInsightsEntryCard
        report={mockReport}
        timeAgo="5d ago"
        onDisclaimerPress={jest.fn()}
      />,
    );

    expect(
      queryByTestId('market-insights-entry-card-button'),
    ).not.toBeInTheDocument();
  });
});
