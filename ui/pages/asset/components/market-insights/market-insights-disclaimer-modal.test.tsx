import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  en as enLocale,
  renderWithProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import { MarketInsightsDisclaimerModal } from './market-insights-disclaimer-modal';

const en = enLocale as unknown as Record<string, { message: string }>;

describe('MarketInsightsDisclaimerModal', () => {
  it('renders nothing when closed', () => {
    const { queryByTestId } = renderWithProvider(
      <MarketInsightsDisclaimerModal isOpen={false} onClose={jest.fn()} />,
    );

    expect(
      queryByTestId('market-insights-disclaimer-modal'),
    ).not.toBeInTheDocument();
  });

  it('renders the title and body when open', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <MarketInsightsDisclaimerModal isOpen onClose={jest.fn()} />,
    );

    expect(getByTestId('market-insights-disclaimer-modal')).toBeInTheDocument();
    expect(
      getByText(en.marketInsightsDisclaimerTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(en.marketInsightsDisclaimerBody.message),
    ).toBeInTheDocument();
  });

  it('closes when the got-it button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProvider(
      <MarketInsightsDisclaimerModal isOpen onClose={onClose} />,
    );

    fireEvent.click(getByTestId('market-insights-disclaimer-got-it'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
