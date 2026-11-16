import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  MarketInsightsViewSkeleton,
  MARKET_INSIGHTS_VIEW_SKELETON_TEST_ID,
} from './market-insights-view-skeleton';

describe('MarketInsightsViewSkeleton', () => {
  it('renders the view skeleton with test id', () => {
    const { getByTestId } = renderWithProvider(<MarketInsightsViewSkeleton />);

    expect(
      getByTestId(MARKET_INSIGHTS_VIEW_SKELETON_TEST_ID),
    ).toBeInTheDocument();
  });
});
