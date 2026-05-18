import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { Position } from '@metamask/perps-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PositionCard } from './position-card';

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatPercentWithMinThreshold: (value: number) =>
      `${(value * 100).toFixed(2)}%`,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
  symbol: 'ETH',
  size: '2.5',
  entryPrice: '2850.00',
  positionValue: '7125.00',
  unrealizedPnl: '375.00',
  marginUsed: '2375.00',
  leverage: {
    type: 'isolated',
    value: 3,
    rawUsd: '2375.00',
  },
  liquidationPrice: '2400.00',
  maxLeverage: 20,
  returnOnEquity: '0.1579',
  cumulativeFunding: {
    allTime: '12.50',
    sinceOpen: '8.30',
    sinceChange: '0.00',
  },
  takeProfitPrice: '3200.00',
  stopLossPrice: '2600.00',
  takeProfitCount: 1,
  stopLossCount: 1,
  ...overrides,
});

describe('PositionCard', () => {
  it('renders the position card with correct data-testid', () => {
    const position = createMockPosition({ symbol: 'ETH' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByTestId('position-card-ETH')).toBeInTheDocument();
  });

  it('displays the correct coin name', () => {
    const position = createMockPosition({ symbol: 'BTC' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('displays HIP-3 coin without prefix', () => {
    const position = createMockPosition({ symbol: 'xyz:TSLA' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });

  it('displays long direction for positive size', () => {
    const position = createMockPosition({
      size: '5.0',
      leverage: { type: 'isolated', value: 10 },
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText(/10x long/iu)).toBeInTheDocument();
  });

  it('displays short direction for negative size', () => {
    const position = createMockPosition({
      size: '-5.0',
      leverage: { type: 'cross', value: 15 },
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText(/15x short/iu)).toBeInTheDocument();
  });

  it('displays the absolute position size', () => {
    const position = createMockPosition({ symbol: 'SOL', size: '-50.0' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    // Should display absolute value without negative sign
    expect(screen.getByText('50 SOL')).toBeInTheDocument();
  });

  it('displays the position value', () => {
    const position = createMockPosition({ positionValue: '7125.00' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText('$7,125')).toBeInTheDocument();
  });

  it('displays positive P&L with + prefix', () => {
    const position = createMockPosition({ unrealizedPnl: '500.00' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText('+$500.00')).toBeInTheDocument();
  });

  it('displays negative P&L with - prefix', () => {
    const position = createMockPosition({ unrealizedPnl: '-250.00' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText('-$250.00')).toBeInTheDocument();
  });

  it('renders the token logo', () => {
    const position = createMockPosition({ symbol: 'ARB' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByTestId('perps-token-logo-ARB')).toBeInTheDocument();
  });

  it('handles positions with isolated leverage', () => {
    const position = createMockPosition({
      leverage: { type: 'isolated', value: 5, rawUsd: '1000.00' },
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText(/5x/u)).toBeInTheDocument();
  });

  it('handles positions with cross leverage', () => {
    const position = createMockPosition({
      leverage: { type: 'cross', value: 20 },
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText(/20x/u)).toBeInTheDocument();
  });

  it('handles zero unrealized P&L', () => {
    const position = createMockPosition({ unrealizedPnl: '0' });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByText('+$0.00')).toBeInTheDocument();
  });

  it('displays ROE percentage for a profitable position', () => {
    const position = createMockPosition({
      symbol: 'ETH',
      returnOnEquity: '0.1579',
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByTestId('position-card-roe-ETH')).toHaveTextContent(
      '(15.79%)',
    );
  });

  it('displays ROE percentage for a losing position', () => {
    const position = createMockPosition({
      symbol: 'BTC',
      unrealizedPnl: '-250.00',
      returnOnEquity: '-0.1667',
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(screen.getByTestId('position-card-roe-BTC')).toHaveTextContent(
      '(-16.67%)',
    );
  });

  it('does not render ROE when returnOnEquity is not a number', () => {
    const position = createMockPosition({
      symbol: 'ETH',
      returnOnEquity: 'not-a-number',
    });
    renderWithProvider(<PositionCard position={position} />, mockStore);

    expect(
      screen.queryByTestId('position-card-roe-ETH'),
    ).not.toBeInTheDocument();
  });

  it('renders the expanded row variant with contextual metrics and action callbacks', () => {
    const position = createMockPosition({
      symbol: 'BTC',
      unrealizedPnl: '125.50',
      returnOnEquity: '0.015',
    });
    const onOpenTPSL = jest.fn();
    const onAddMargin = jest.fn();
    const onReverse = jest.fn();
    const onClose = jest.fn();

    renderWithProvider(
      <PositionCard
        position={position}
        variant="expanded"
        onOpenTPSL={onOpenTPSL}
        onAddMargin={onAddMargin}
        onReverse={onReverse}
        onClose={onClose}
      />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-expanded-position-row-BTC'),
    ).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();
    expect(screen.getByText('Auto close')).toBeInTheDocument();
    expect(screen.getByText('Margin')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-expanded-position-pnl-BTC'),
    ).toHaveTextContent('+$125.50 (1.50%)');
    expect(
      screen.getByTestId('perps-expanded-position-tpsl-value-BTC'),
    ).toHaveTextContent('TP $3,200, SL $2,600');
    expect(
      screen.getByTestId('perps-expanded-position-tpsl-edit-BTC'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-expanded-position-margin-value-BTC'),
    ).toHaveTextContent('$2,375');
    expect(
      screen.getByTestId('perps-expanded-position-margin-edit-BTC'),
    ).toBeInTheDocument();
    expect(screen.getByText('Reverse position')).toBeInTheDocument();
    expect(screen.getByText('Close long')).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('perps-expanded-position-tpsl-edit-BTC'),
    );
    fireEvent.click(screen.getByTestId('perps-expanded-position-row-BTC'));
    expect(onAddMargin).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByTestId('perps-expanded-position-margin-edit-BTC'),
    );
    fireEvent.click(screen.getByTestId('perps-expanded-position-reverse-BTC'));
    fireEvent.click(screen.getByTestId('perps-expanded-position-close-BTC'));

    expect(onOpenTPSL).toHaveBeenCalledWith(position);
    expect(onAddMargin).toHaveBeenCalledWith(position);
    expect(onReverse).toHaveBeenCalledWith(position);
    expect(onClose).toHaveBeenCalledWith(position);
  });

  it('renders auto close fallbacks in the expanded row variant', () => {
    const position = createMockPosition({
      symbol: 'SOL',
      takeProfitPrice: undefined,
      stopLossPrice: undefined,
    });

    renderWithProvider(
      <PositionCard position={position} variant="expanded" />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-expanded-position-tpsl-value-SOL'),
    ).toHaveTextContent('TP -, SL -');
  });
});
