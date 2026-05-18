import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsMarketExpandedOrderTicket } from './perps-market-expanded-order-ticket';

jest.mock('../order-entry', () => ({
  DirectionTabs: ({ direction }: { direction: string }) => (
    <div data-testid="direction-tabs">{direction}</div>
  ),
  OrderEntry: ({
    initialDirection,
    mode,
    existingPosition,
    orderType,
    prefillLimitPrice,
  }: {
    initialDirection: string;
    mode: string;
    existingPosition?: { size: string };
    orderType: string;
    prefillLimitPrice?: { price: string };
  }) => (
    <div
      data-testid="order-entry"
      data-direction={initialDirection}
      data-mode={mode}
      data-existing-size={existingPosition?.size ?? ''}
      data-order-type={orderType}
      data-prefill={prefillLimitPrice?.price ?? ''}
    />
  ),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsMarketExpandedOrderTicket', () => {
  it('renders direction tabs, order entry props, and pending state', () => {
    renderWithProvider(
      <PerpsMarketExpandedOrderTicket
        asset="BTC"
        currentPrice={45000}
        maxLeverage={50}
        availableBalance={1000}
        direction="short"
        orderType="limit"
        initialLeverage={3}
        isPending
        prefillLimitPrice={{ price: '44900', id: 1 }}
        onDirectionChange={jest.fn()}
        onOrderTypeChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
      mockStore,
    );

    expect(screen.getByTestId('direction-tabs')).toHaveTextContent('short');
    expect(screen.getByTestId('order-entry')).toHaveAttribute(
      'data-direction',
      'short',
    );
    expect(screen.getByTestId('order-entry')).toHaveAttribute(
      'data-mode',
      'new',
    );
    expect(screen.getByTestId('order-entry')).toHaveAttribute(
      'data-order-type',
      'limit',
    );
    expect(screen.getByTestId('order-entry')).toHaveAttribute(
      'data-prefill',
      '44900',
    );
    expect(screen.getByTestId('perps-expanded-order-ticket')).toHaveClass(
      'pointer-events-none',
    );
  });

  it('renders modify mode for an existing position and wires compact actions', () => {
    const onReversePosition = jest.fn();
    const onClosePosition = jest.fn();

    renderWithProvider(
      <PerpsMarketExpandedOrderTicket
        asset="BTC"
        currentPrice={45000}
        maxLeverage={50}
        availableBalance={1000}
        direction="long"
        orderType="limit"
        initialLeverage={3}
        isPending={false}
        existingPosition={{
          symbol: 'BTC',
          size: '0.5',
          leverage: 3,
          entryPrice: '$44,000.00',
        }}
        prefillLimitPrice={{ price: '44900', id: 1 }}
        onDirectionChange={jest.fn()}
        onOrderTypeChange={jest.fn()}
        onSubmit={jest.fn()}
        onReversePosition={onReversePosition}
        onClosePosition={onClosePosition}
      />,
      mockStore,
    );

    expect(screen.queryByTestId('direction-tabs')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('perps-expanded-position-ticket-actions'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('order-entry')).toHaveAttribute(
      'data-mode',
      'modify',
    );
    expect(screen.getByTestId('order-entry')).toHaveAttribute(
      'data-existing-size',
      '0.5',
    );

    fireEvent.click(
      screen.getByTestId('perps-expanded-ticket-reverse-position'),
    );
    fireEvent.click(screen.getByTestId('perps-expanded-ticket-close-position'));

    expect(onReversePosition).toHaveBeenCalledTimes(1);
    expect(onClosePosition).toHaveBeenCalledTimes(1);
  });
});
