import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import type { Order, Position } from '../types';
import { PerpsMarketExpandedBottomPanel } from './perps-market-expanded-bottom-panel';

jest.mock('../order-card', () => ({
  OrderCard: ({
    order,
    onClick,
  }: {
    order: Order;
    onClick: (order: Order) => void;
  }) => (
    <button
      type="button"
      data-testid={`order-card-${order.orderId}`}
      onClick={() => onClick(order)}
    >
      {order.symbol}
    </button>
  ),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const position = {
  symbol: 'BTC',
  size: '0.5',
  leverage: { type: 'isolated', value: 3 },
  entryPrice: '$44,000.00',
  positionValue: '$22,500.00',
  marginUsed: '$7,500.00',
  unrealizedPnl: '125.50',
  returnOnEquity: '1.5',
} as unknown as Position;

const order = {
  orderId: 'order-1',
  symbol: 'BTC',
  status: 'open',
} as unknown as Order;

describe('PerpsMarketExpandedBottomPanel', () => {
  it('keeps tabs visible, renders an empty state, and avoids duplicate titles', () => {
    const { container } = renderWithProvider(
      <PerpsMarketExpandedBottomPanel
        positions={[]}
        orders={[]}
        onPositionTPSL={jest.fn()}
        onPositionAddMargin={jest.fn()}
        onPositionReverse={jest.fn()}
        onPositionClose={jest.fn()}
        onOrderClick={jest.fn()}
      />,
      mockStore,
    );

    expect(screen.getByRole('tab', { name: 'Positions' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Open Orders' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Positions')).toHaveLength(1);
    expect(
      screen.getByTestId('perps-expanded-bottom-empty-state'),
    ).toBeInTheDocument();
    expect(container.querySelector('.border-b-text-default')).toBeNull();
    expect(screen.getByTestId('perps-expanded-bottom-panel')).toHaveClass(
      'overflow-hidden',
      'shrink-0',
    );
    expect(screen.getByTestId('perps-expanded-bottom-panel')).toHaveStyle({
      flexBasis: 'clamp(160px, 32vh, 280px)',
      height: 'clamp(160px, 32vh, 280px)',
      maxHeight: 'clamp(160px, 32vh, 280px)',
    });
    expect(screen.getByTestId('perps-expanded-bottom-tabpanel')).toHaveClass(
      'min-h-0',
      'flex-1',
      'overflow-y-auto',
    );
  });

  it('renders multiple position rows with callbacks inside the scrollable panel', () => {
    const onPositionClose = jest.fn();
    const onOrderClick = jest.fn();
    const positions = Array.from({ length: 6 }).map((_, index) => ({
      ...position,
      symbol: `BTC${index}`,
    }));

    renderWithProvider(
      <PerpsMarketExpandedBottomPanel
        positions={positions}
        orders={[order]}
        onPositionTPSL={jest.fn()}
        onPositionAddMargin={jest.fn()}
        onPositionReverse={jest.fn()}
        onPositionClose={onPositionClose}
        onOrderClick={onOrderClick}
      />,
      mockStore,
    );

    expect(screen.getByTestId('perps-expanded-bottom-tabpanel')).toHaveClass(
      'min-h-0',
      'flex-1',
      'overflow-y-auto',
    );
    expect(screen.getAllByTestId(/perps-expanded-position-row-/u)).toHaveLength(
      6,
    );

    fireEvent.click(screen.getByTestId('perps-expanded-position-close-BTC0'));
    expect(onPositionClose).toHaveBeenCalledWith(positions[0]);

    fireEvent.click(screen.getByRole('tab', { name: 'Open Orders' }));
    fireEvent.click(screen.getByTestId('order-card-order-1'));
    expect(onOrderClick).toHaveBeenCalledWith(order);
  });

  it('renders stable row skeletons while loading', () => {
    renderWithProvider(
      <PerpsMarketExpandedBottomPanel
        positions={[]}
        orders={[]}
        isPositionsLoading
        onPositionTPSL={jest.fn()}
        onPositionAddMargin={jest.fn()}
        onPositionReverse={jest.fn()}
        onPositionClose={jest.fn()}
        onOrderClick={jest.fn()}
      />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-expanded-bottom-skeleton'),
    ).toBeInTheDocument();
  });
});
