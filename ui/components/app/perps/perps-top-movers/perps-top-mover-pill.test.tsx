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

  it('sizes to its label but can never outgrow the row', () => {
    renderPill();

    const pill = screen.getByTestId('perps-top-movers-pill-BTC');

    // Content width, as on mobile.
    expect(pill).toHaveClass('w-auto');
    expect(pill).not.toHaveClass('w-full');
    // The list wraps rather than scrolls, so a pill must be able to give way if
    // its label alone is wider than the row. `shrink-0` would pin it at content
    // width and push the section sideways again.
    expect(pill).toHaveClass('max-w-full', 'min-w-0');
    expect(pill).not.toHaveClass('shrink-0');
    // The pill is content-height, so its 24px logo plus this 12px of padding is
    // what makes it 36px. The loading skeleton hardcodes that 36px as `h-9`, so
    // changing either of these without changing the skeleton reintroduces a
    // reflow when the ranking lands.
    expect(pill).toHaveClass('h-auto', 'py-1.5');
  });

  it('truncates a long ticker rather than pushing the change out of the cell', () => {
    renderPill({ symbol: 'AVERYLONGTICKER' });

    const pill = screen.getByTestId('perps-top-movers-pill-AVERYLONGTICKER');

    // jsdom computes no layout, so the behaviour is pinned through the classes
    // that produce it: the ticker is the only part allowed to shrink and clip,
    // and the change value is held at its natural width so a long ticker can
    // never squeeze it out of the cell.
    expect(screen.getByText('AVERYLONGTICKER')).toHaveClass(
      'min-w-0',
      'truncate',
    );
    expect(screen.getByText('+2.84%')).toHaveClass('shrink-0');
    // `truncate` clips through text-overflow, so the whole ticker stays in the
    // DOM and the button keeps its full accessible name.
    expect(pill).toHaveTextContent('AVERYLONGTICKER');
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
