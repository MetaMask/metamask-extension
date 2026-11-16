import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MarketInsightsEntryCardSkeleton } from './market-insights-entry-card-skeleton';

describe('MarketInsightsEntryCardSkeleton', () => {
  it('renders the skeleton with a stable test id', () => {
    const { getByTestId } = renderWithProvider(
      <MarketInsightsEntryCardSkeleton />,
    );

    expect(getByTestId('market-insights-skeleton')).toBeInTheDocument();
  });
});
