import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import type { PerpsMarketData } from '../types';
import { PerpsTopMoverPill } from './perps-top-mover-pill';

const mockStore = configureStore({ metamask: { ...mockState.metamask } });

const createMarket = (
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData =>
  ({
    symbol: 'BTC',
    name: 'Bitcoin',
    maxLeverage: '20x',
    price: '$45,250.00',
    change24h: '+$1,250.00',
    change24hPercent: '+2.84%',
    volume: '$1.2B',
    ...overrides,
  }) as PerpsMarketData;

const onPress = jest.fn();

const renderPill = (overrides: Partial<PerpsMarketData> = {}) =>
  renderWithProvider(
    <PerpsTopMoverPill market={createMarket(overrides)} onPress={onPress} />,
    mockStore,
  );

describe('PerpsTopMoverPill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the pill for the market', () => {
    renderPill();

    expect(screen.getByTestId('perps-top-movers-pill-BTC')).toBeInTheDocument();
  });

  it('displays the ticker', () => {
    renderPill();

    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('displays the signed 24h change', () => {
    renderPill();

    expect(screen.getByText('+2.84%')).toBeInTheDocument();
  });

  it('signs a positive change that arrives without a sign', () => {
    renderPill({ change24hPercent: '2.84%' });

    expect(screen.getByText('+2.84%')).toBeInTheDocument();
  });

  it('displays a negative change unchanged', () => {
    renderPill({ change24hPercent: '-4.10%' });

    expect(screen.getByText('-4.10%')).toBeInTheDocument();
  });

  it('strips the provider prefix from a HIP-3 ticker', () => {
    renderPill({ symbol: 'xyz:TSLA', name: 'Tesla' });

    expect(
      screen.getByTestId('perps-top-movers-pill-xyz-TSLA'),
    ).toHaveTextContent('TSLA');
  });

  it('calls onPress with the market when the pill is clicked', () => {
    const market = createMarket();
    renderWithProvider(
      <PerpsTopMoverPill market={market} onPress={onPress} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-top-movers-pill-BTC'));

    expect(onPress).toHaveBeenCalledWith(market);
  });
});
