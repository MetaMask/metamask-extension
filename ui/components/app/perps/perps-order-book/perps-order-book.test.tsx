import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsOrderBook } from './perps-order-book';

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) => `$${value}`,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const orderBook = {
  bids: [
    {
      price: '45000',
      size: '1',
      total: '1',
      notional: '45000',
      totalNotional: '45000',
    },
  ],
  asks: [
    {
      price: '45100',
      size: '2',
      total: '2',
      notional: '90200',
      totalNotional: '90200',
    },
  ],
  spread: '100',
  spreadPercentage: '0.0022',
  midPrice: '45050',
  maxTotal: '2',
  lastUpdated: 0,
};

describe('PerpsOrderBook', () => {
  let resizeObserverHeight = 214;

  beforeEach(() => {
    resizeObserverHeight = 214;

    class ResizeObserverMock {
      readonly #callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.#callback = callback;
      }

      observe() {
        this.#callback(
          [
            {
              contentRect: { height: resizeObserverHeight },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      }

      disconnect() {
        return undefined;
      }
    }

    global.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it('fills available height with balanced placeholder rows', () => {
    renderWithProvider(<PerpsOrderBook orderBook={orderBook} />, mockStore);

    expect(
      screen.getByTestId('perps-order-book-row-ask-45100'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-order-book-row-bid-45000'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('perps-order-book-placeholder-ask'),
    ).toHaveLength(3);
    expect(
      screen.getAllByTestId('perps-order-book-placeholder-bid'),
    ).toHaveLength(3);
  });

  it('adds normal-height rows as the container grows', () => {
    resizeObserverHeight = 450;

    renderWithProvider(<PerpsOrderBook orderBook={orderBook} />, mockStore);

    expect(
      screen.getAllByTestId('perps-order-book-placeholder-ask'),
    ).toHaveLength(5);
    expect(
      screen.getAllByTestId('perps-order-book-placeholder-bid'),
    ).toHaveLength(5);
    expect(
      Number.parseFloat(
        screen.getByTestId('perps-order-book-row-ask-45100').style.height,
      ),
    ).toBeGreaterThanOrEqual(28);
    expect(
      Number.parseFloat(
        screen.getByTestId('perps-order-book-row-bid-45000').style.height,
      ),
    ).toBeGreaterThanOrEqual(28);
    expect(
      screen.getByTestId('perps-order-book-row-ask-45100').style.height,
    ).toBe(
      screen.getAllByTestId('perps-order-book-placeholder-ask')[0].style.height,
    );
    expect(
      screen.getByTestId('perps-order-book-row-bid-45000').style.height,
    ).toBe(
      screen.getAllByTestId('perps-order-book-placeholder-bid')[0].style.height,
    );
  });

  it('calls onPriceClick when a level is clicked', () => {
    const onPriceClick = jest.fn();
    renderWithProvider(
      <PerpsOrderBook orderBook={orderBook} onPriceClick={onPriceClick} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-order-book-row-bid-45000'));

    expect(onPriceClick).toHaveBeenCalledWith({
      price: '45000',
      side: 'bid',
    });
  });
});
