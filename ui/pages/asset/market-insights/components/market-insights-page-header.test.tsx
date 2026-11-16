import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import {
  MarketInsightsPageHeader,
  MARKET_INSIGHTS_BACK_BUTTON_TEST_ID,
  MARKET_INSIGHTS_VIEW_HEADER_TEST_ID,
} from './market-insights-page-header';

const en = enLocale as unknown as Record<string, { message: string }>;
const titleMessage = en.marketInsightsTitle.message;

describe('MarketInsightsPageHeader', () => {
  it('renders the header with the market insights title', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MarketInsightsPageHeader onBackPress={jest.fn()} />,
    );

    expect(
      getByTestId(MARKET_INSIGHTS_VIEW_HEADER_TEST_ID),
    ).toBeInTheDocument();
    expect(getByText(titleMessage)).toBeInTheDocument();
  });

  it('calls onBackPress when the back button is pressed', () => {
    const onBackPress = jest.fn();
    const { getByTestId } = renderWithProvider(
      <MarketInsightsPageHeader onBackPress={onBackPress} />,
    );

    fireEvent.click(getByTestId(MARKET_INSIGHTS_BACK_BUTTON_TEST_ID));

    expect(onBackPress).toHaveBeenCalledTimes(1);
  });
});
