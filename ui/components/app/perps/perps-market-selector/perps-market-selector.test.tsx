import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { PerpsMarketSelector } from './perps-market-selector';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const markets = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: '$45,000.00',
    change24hPercent: '1.25%',
    maxLeverage: '50x',
    volume: '$1B',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: '$2,500.00',
    change24hPercent: '-0.50%',
    maxLeverage: '25x',
    volume: '$500M',
  },
] as unknown as PerpsMarketData[];

describe('PerpsMarketSelector', () => {
  it('searches markets and calls onMarketSelect', () => {
    const onMarketSelect = jest.fn();
    renderWithProvider(
      <PerpsMarketSelector
        markets={markets}
        currentSymbol="BTC"
        onMarketSelect={onMarketSelect}
      />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-market-selector-button'));
    fireEvent.change(screen.getByTestId('perps-market-selector-search'), {
      target: { value: 'eth' },
    });
    fireEvent.click(screen.getByTestId('perps-market-selector-option-ETH'));

    expect(onMarketSelect).toHaveBeenCalledWith('ETH');
  });

  it('shows the empty state when no markets match', () => {
    renderWithProvider(
      <PerpsMarketSelector
        markets={markets}
        currentSymbol="BTC"
        onMarketSelect={jest.fn()}
      />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-market-selector-button'));
    fireEvent.change(screen.getByTestId('perps-market-selector-search'), {
      target: { value: 'does-not-exist' },
    });

    expect(
      screen.getByText(messages.perpsNoMarketsFound.message),
    ).toBeInTheDocument();
  });
});
