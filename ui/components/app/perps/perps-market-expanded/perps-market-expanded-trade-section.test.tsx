import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { OrderBookPriceClick } from '../perps-order-book';
import type { Position } from '../types';
import { PerpsMarketExpandedTradeSection } from './perps-market-expanded-trade-section';

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLivePrices: () => ({
    prices: {
      BTC: {
        symbol: 'BTC',
        markPrice: '45001',
      },
    },
  }),
}));

jest.mock('./perps-market-expanded-order-book-panel', () => ({
  PerpsMarketExpandedOrderBookPanel: ({
    onPriceClick,
  }: {
    onPriceClick: (priceClick: OrderBookPriceClick) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-order-book-price"
      onClick={() => onPriceClick({ price: '44900', side: 'bid' })}
    >
      order book price
    </button>
  ),
}));

jest.mock('./perps-market-expanded-order-ticket', () => ({
  PerpsMarketExpandedOrderTicket: ({
    direction,
    orderType,
    markPrice,
    existingPosition,
    prefillLimitPrice,
    onDirectionChange,
    onReversePosition,
    onClosePosition,
  }: {
    direction: 'long' | 'short';
    orderType: 'market' | 'limit';
    markPrice?: number;
    existingPosition?: { size: string };
    prefillLimitPrice?: { price: string };
    onDirectionChange: (direction: 'long' | 'short') => void;
    onReversePosition?: () => void;
    onClosePosition?: () => void;
  }) => (
    <div
      data-testid="mock-order-ticket"
      data-direction={direction}
      data-order-type={orderType}
      data-mode={existingPosition ? 'modify' : 'new'}
      data-existing-size={existingPosition?.size ?? ''}
      data-mark-price={markPrice}
      data-prefill={prefillLimitPrice?.price ?? ''}
    >
      <button type="button" onClick={() => onDirectionChange('short')}>
        short
      </button>
      {existingPosition ? (
        <>
          <button
            type="button"
            data-testid="mock-reverse-position"
            onClick={onReversePosition}
          >
            reverse
          </button>
          <button
            type="button"
            data-testid="mock-close-position"
            onClick={onClosePosition}
          >
            close
          </button>
        </>
      ) : null}
    </div>
  ),
}));

const defaultProps = {
  symbol: 'BTC',
  currentPrice: 45000,
  maxLeverage: 50,
  availableBalance: 1000,
  initialLeverage: 3,
  isPending: false,
  isEligible: true,
  onGeoBlocked: jest.fn(),
  onSubmit: jest.fn(),
  onPositionReverse: jest.fn(),
  onPositionClose: jest.fn(),
};

describe('PerpsMarketExpandedTradeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefills limit price from the order book without changing direction', () => {
    render(<PerpsMarketExpandedTradeSection {...defaultProps} />);

    fireEvent.click(screen.getByText('short'));
    fireEvent.click(screen.getByTestId('mock-order-book-price'));

    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-direction',
      'short',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-order-type',
      'limit',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-prefill',
      '44900',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-mark-price',
      '45001',
    );
  });

  it('geo-blocks order-book trade prep before mutating ticket state', () => {
    const onGeoBlocked = jest.fn();

    render(
      <PerpsMarketExpandedTradeSection
        {...defaultProps}
        isEligible={false}
        onGeoBlocked={onGeoBlocked}
      />,
    );

    fireEvent.click(screen.getByTestId('mock-order-book-price'));

    expect(onGeoBlocked).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-order-type',
      'market',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-prefill',
      '',
    );
  });

  it('uses modify mode and position direction when the market has an open position', () => {
    const onPositionReverse = jest.fn();
    const onPositionClose = jest.fn();

    render(
      <PerpsMarketExpandedTradeSection
        {...defaultProps}
        activePosition={
          {
            symbol: 'BTC',
            size: '-0.5',
            leverage: { type: 'isolated', value: 3 },
            entryPrice: '$44,000.00',
          } as unknown as Position
        }
        onPositionReverse={onPositionReverse}
        onPositionClose={onPositionClose}
      />,
    );

    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-direction',
      'short',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-mode',
      'modify',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-existing-size',
      '-0.5',
    );

    fireEvent.click(screen.getByTestId('mock-order-book-price'));
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-order-type',
      'limit',
    );
    expect(screen.getByTestId('mock-order-ticket')).toHaveAttribute(
      'data-prefill',
      '44900',
    );

    fireEvent.click(screen.getByTestId('mock-reverse-position'));
    fireEvent.click(screen.getByTestId('mock-close-position'));

    expect(onPositionReverse).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'BTC' }),
    );
    expect(onPositionClose).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'BTC' }),
    );
  });

  it('geo-blocks positioned close and reverse actions', () => {
    const onGeoBlocked = jest.fn();
    const onPositionReverse = jest.fn();
    const onPositionClose = jest.fn();

    render(
      <PerpsMarketExpandedTradeSection
        {...defaultProps}
        isEligible={false}
        activePosition={
          {
            symbol: 'BTC',
            size: '0.5',
            leverage: { type: 'isolated', value: 3 },
            entryPrice: '$44,000.00',
          } as unknown as Position
        }
        onGeoBlocked={onGeoBlocked}
        onPositionReverse={onPositionReverse}
        onPositionClose={onPositionClose}
      />,
    );

    fireEvent.click(screen.getByTestId('mock-reverse-position'));
    fireEvent.click(screen.getByTestId('mock-close-position'));

    expect(onGeoBlocked).toHaveBeenCalledTimes(2);
    expect(onPositionReverse).not.toHaveBeenCalled();
    expect(onPositionClose).not.toHaveBeenCalled();
  });
});
