import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PositionCard } from './position-card';
import type { Position } from '@metamask/perps-controller';

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number, _currency: string) =>
      `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
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
  returnOnEquity: '15.79',
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

    expect(screen.getByText('$7,125.00')).toBeInTheDocument();
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
});
