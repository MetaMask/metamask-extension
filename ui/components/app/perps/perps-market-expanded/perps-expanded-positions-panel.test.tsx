import React from 'react';
import { render, screen } from '@testing-library/react';
import { PerpsExpandedPositionsPanel } from './perps-expanded-positions-panel';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const mockUsePerpsLivePositions = jest.fn(() => ({
  positions: [],
  isInitialLoading: false,
}));
const mockUsePerpsLiveOrders = jest.fn(() => ({
  orders: [],
  isInitialLoading: false,
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLivePositions: () => mockUsePerpsLivePositions(),
  usePerpsLiveOrders: () => mockUsePerpsLiveOrders(),
}));

jest.mock('../perps-positions-orders', () => ({
  PerpsPositionsOrders: ({
    positions,
    orders,
  }: {
    positions: unknown[];
    orders: unknown[];
  }) => (
    <div
      data-testid="perps-positions-orders"
      data-positions={positions.length}
      data-orders={orders.length}
    />
  ),
}));

const mockEthPosition = {
  symbol: 'ETH',
  size: '2.5',
  entryPrice: '2850.00',
  positionValue: '7125.00',
  unrealizedPnl: '375.00',
  marginUsed: '2375.00',
  leverage: { type: 'isolated' as const, value: 3, rawUsd: '2375.00' },
  liquidationPrice: '2400.00',
  maxLeverage: 20,
  returnOnEquity: '0.1579',
  cumulativeFunding: {
    allTime: '12.50',
    sinceOpen: '8.30',
    sinceChange: '0.00',
  },
};

const mockBtcPosition = {
  symbol: 'BTC',
  size: '-0.5',
  entryPrice: '45000.00',
  positionValue: '22500.00',
  unrealizedPnl: '-250.00',
  marginUsed: '1500.00',
  leverage: { type: 'cross' as const, value: 15 },
  liquidationPrice: '48000.00',
  maxLeverage: 20,
  returnOnEquity: '-0.1667',
  cumulativeFunding: {
    allTime: '-5.20',
    sinceOpen: '-3.10',
    sinceChange: '0.00',
  },
};

const mockEthOrder = {
  symbol: 'ETH',
  orderId: '1',
  size: '1',
  price: '2800',
  side: 'buy',
  orderType: 'limit',
  isTrigger: false,
};
const mockBtcOrder = {
  symbol: 'BTC',
  orderId: '2',
  size: '0.5',
  price: '44000',
  side: 'sell',
  orderType: 'limit',
  isTrigger: false,
};

describe('PerpsExpandedPositionsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsLivePositions.mockReturnValue({
      positions: [],
      isInitialLoading: false,
    });
    mockUsePerpsLiveOrders.mockReturnValue({
      orders: [],
      isInitialLoading: false,
    });
  });

  it('renders the panel container', () => {
    const { getByTestId } = render(<PerpsExpandedPositionsPanel />);
    expect(getByTestId('perps-expanded-positions-panel')).toBeInTheDocument();
  });

  it('shows empty state text when there are no positions or orders', () => {
    render(<PerpsExpandedPositionsPanel />);
    expect(screen.getByText('perpsNoOpenPositions')).toBeInTheDocument();
  });

  it('does not render PerpsPositionsOrders in empty state', () => {
    render(<PerpsExpandedPositionsPanel />);
    expect(
      screen.queryByTestId('perps-positions-orders'),
    ).not.toBeInTheDocument();
  });

  it('renders PerpsPositionsOrders when positions exist', () => {
    mockUsePerpsLivePositions.mockReturnValue({
      positions: [mockEthPosition],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel />);

    expect(screen.getByTestId('perps-positions-orders')).toBeInTheDocument();
    expect(screen.queryByText('perpsNoOpenPositions')).not.toBeInTheDocument();
  });

  it('renders PerpsPositionsOrders when orders exist', () => {
    mockUsePerpsLiveOrders.mockReturnValue({
      orders: [mockEthOrder],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel />);

    expect(screen.getByTestId('perps-positions-orders')).toBeInTheDocument();
  });

  it('filters positions by symbol when symbol prop is provided', () => {
    mockUsePerpsLivePositions.mockReturnValue({
      positions: [mockEthPosition, mockBtcPosition],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel symbol="ETH" />);

    const ordersComponent = screen.getByTestId('perps-positions-orders');
    expect(ordersComponent).toHaveAttribute('data-positions', '1');
  });

  it('filters orders by symbol when symbol prop is provided', () => {
    mockUsePerpsLiveOrders.mockReturnValue({
      orders: [mockEthOrder, mockBtcOrder],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel symbol="ETH" />);

    const ordersComponent = screen.getByTestId('perps-positions-orders');
    expect(ordersComponent).toHaveAttribute('data-orders', '1');
  });

  it('shows all positions when no symbol prop is provided', () => {
    mockUsePerpsLivePositions.mockReturnValue({
      positions: [mockEthPosition, mockBtcPosition],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel />);

    const ordersComponent = screen.getByTestId('perps-positions-orders');
    expect(ordersComponent).toHaveAttribute('data-positions', '2');
  });

  it('shows all orders when no symbol prop is provided', () => {
    mockUsePerpsLiveOrders.mockReturnValue({
      orders: [mockEthOrder, mockBtcOrder],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel />);

    const ordersComponent = screen.getByTestId('perps-positions-orders');
    expect(ordersComponent).toHaveAttribute('data-orders', '2');
  });

  it('shows empty state when symbol filter matches no positions or orders', () => {
    mockUsePerpsLivePositions.mockReturnValue({
      positions: [mockEthPosition],
      isInitialLoading: false,
    });
    mockUsePerpsLiveOrders.mockReturnValue({
      orders: [mockEthOrder],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel symbol="SOL" />);

    expect(screen.getByText('perpsNoOpenPositions')).toBeInTheDocument();
  });

  it('performs case-insensitive symbol filtering for positions', () => {
    mockUsePerpsLivePositions.mockReturnValue({
      positions: [mockEthPosition],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel symbol="eth" />);

    const ordersComponent = screen.getByTestId('perps-positions-orders');
    expect(ordersComponent).toHaveAttribute('data-positions', '1');
  });

  it('performs case-insensitive symbol filtering for orders', () => {
    mockUsePerpsLiveOrders.mockReturnValue({
      orders: [mockEthOrder],
      isInitialLoading: false,
    });

    render(<PerpsExpandedPositionsPanel symbol="eth" />);

    const ordersComponent = screen.getByTestId('perps-positions-orders');
    expect(ordersComponent).toHaveAttribute('data-orders', '1');
  });
});
