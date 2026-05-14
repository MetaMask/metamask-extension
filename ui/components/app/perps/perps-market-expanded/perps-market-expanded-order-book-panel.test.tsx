import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsMarketExpandedOrderBookPanel } from './perps-market-expanded-order-book-panel';

jest.mock('../../../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: () => ({ address: '0x123' }),
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveOrderBook: () => ({
    orderBook: null,
    isInitialLoading: false,
  }),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../perps-order-book', () => ({
  PerpsOrderBook: () => <div data-testid="mock-order-book" />,
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsMarketExpandedOrderBookPanel', () => {
  it('renders the expanded order book with normal density', () => {
    renderWithProvider(
      <PerpsMarketExpandedOrderBookPanel
        symbol="BTC"
        onPriceClick={jest.fn()}
      />,
      mockStore,
    );

    expect(screen.getByTestId('mock-order-book')).toBeInTheDocument();
  });
});
