import React from 'react';
import { screen, createEvent, fireEvent } from '@testing-library/react';
import { Point } from 'chart.js';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import {
  DEFAULT_USE_HISTORICAL_PRICES_METADATA,
  type HistoricalPrices,
} from '../../hooks/useHistoricalPrices';
import { loadingOpacity } from '../../util';
import { AssetChartBody, type AssetChartBodyProps } from './asset-chart-body';

const PRICES: Point[] = [
  { x: 1, y: 10 },
  { x: 2, y: 30 },
  { x: 3, y: 20 },
];

const METADATA: HistoricalPrices['metadata'] = {
  minPricePoint: PRICES[0],
  maxPricePoint: PRICES[1],
  xMin: 1,
  xMax: 3,
  yMin: 10,
  yMax: 30,
};

const renderBody = (overrides: Partial<AssetChartBodyProps> = {}) =>
  renderWithProvider(
    <AssetChartBody
      prices={PRICES}
      metadata={METADATA}
      loading={false}
      isFetching={false}
      isPlaceholderData={false}
      currency="USD"
      currentPrice={25}
      {...overrides}
    />,
    configureStore({ metamask: { currentLocale: 'en' } }),
  );

describe('AssetChartBody', () => {
  it('renders the chart when there are prices', () => {
    const { container } = renderBody();

    expect(screen.getByTestId('asset-price-chart')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders the empty state instead of the chart once loading finishes with no prices', () => {
    const { container } = renderBody({
      prices: [],
      metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
    });

    expect(screen.getByTestId('asset-price-chart')).toBeInTheDocument();
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('keeps rendering the chart while prices are still loading', () => {
    const { container } = renderBody({
      prices: [],
      metadata: DEFAULT_USE_HISTORICAL_PRICES_METADATA,
      loading: true,
    });

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('mutes the chart while refetching over existing prices', () => {
    renderBody({ isFetching: true });

    expect(
      screen.getByTestId('asset-price-chart').firstElementChild,
    ).toHaveStyle({ opacity: `${loadingOpacity}` });
  });

  it('renders children below the chart, inside the chart container', () => {
    renderBody({ children: <div data-testid="time-ranges" /> });

    const chart = screen.getByTestId('asset-price-chart');
    const children = screen.getByTestId('time-ranges');

    expect(chart).toContainElement(children);
    expect(chart.lastElementChild).toBe(children);
  });

  describe('onHoverPrice', () => {
    it('reports the hovered data point', () => {
      const onHoverPrice = jest.fn();
      const { container } = renderBody({ onHoverPrice });

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      Object.defineProperty(canvas, 'clientWidth', { value: 300 });

      const event = createEvent.mouseMove(canvas);
      Object.defineProperty(event, 'offsetX', { value: 150 });
      fireEvent(canvas, event);

      expect(onHoverPrice).toHaveBeenCalledWith({ price: 20, date: 3 });
    });

    it('reverts to the current price when the pointer leaves', () => {
      const onHoverPrice = jest.fn();
      const { container } = renderBody({ onHoverPrice, currentPrice: 25 });

      fireEvent.mouseOut(
        container.querySelector('canvas') as HTMLCanvasElement,
      );

      expect(onHoverPrice).toHaveBeenCalledWith(
        expect.objectContaining({ price: 25 }),
      );
    });

    it('ignores hover while showing placeholder data', () => {
      const onHoverPrice = jest.fn();
      const { container } = renderBody({
        onHoverPrice,
        isPlaceholderData: true,
      });

      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      Object.defineProperty(canvas, 'clientWidth', { value: 300 });

      const event = createEvent.mouseMove(canvas);
      Object.defineProperty(event, 'offsetX', { value: 150 });
      fireEvent(canvas, event);

      expect(onHoverPrice).not.toHaveBeenCalled();
    });
  });
});
