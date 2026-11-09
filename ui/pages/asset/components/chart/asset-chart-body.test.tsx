import React from 'react';
import { screen, createEvent, fireEvent } from '@testing-library/react';
import { Chart, Point } from 'chart.js';
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

  describe('realtime price', () => {
    const renderedChart = (container: HTMLElement) => {
      const chart = Chart.getChart(
        container.querySelector('canvas') as HTMLCanvasElement,
      );
      if (!chart) {
        throw new Error('no chart was rendered');
      }
      return {
        lastPoint: chart.data.datasets[0].data.at(-1),
        scales: chart.options.scales as {
          x: { max?: number };
          y: { min?: number; max?: number };
        },
      };
    };

    it('leaves the series and bounds untouched when no realtime price is given', () => {
      const { lastPoint, scales } = renderedChart(renderBody().container);

      expect(lastPoint).toEqual(PRICES.at(-1));
      expect(scales.x.max).toBe(METADATA.xMax);
      expect(scales.y.min).toBe(METADATA.yMin);
      expect(scales.y.max).toBe(METADATA.yMax);
    });

    it('moves the final point to the realtime price and widens the bounds to fit it', () => {
      const { lastPoint, scales } = renderedChart(
        renderBody({ realtimePrice: 42, realtimeTimestamp: 9 }).container,
      );

      expect(lastPoint).toEqual({ x: 9, y: 42 });
      expect(scales.x.max).toBe(9);
      expect(scales.y.max).toBe(42);
    });

    it('lowers the minimum when the realtime price is below the range', () => {
      const { scales } = renderedChart(
        renderBody({ realtimePrice: 1, realtimeTimestamp: 9 }).container,
      );

      expect(scales.y.min).toBe(1);
    });

    it('pins the final point to the newest sample when the realtime timestamp is older', () => {
      // The live OHLCV bar's timestamp is its candle bucket's start, which for
      // a coarse interval can sit before the newest historical sample. The
      // final point must not move backwards in time, or its closing segment
      // draws back across the whole chart.
      const { lastPoint, scales } = renderedChart(
        renderBody({ realtimePrice: 42, realtimeTimestamp: 2 }).container,
      );

      expect(lastPoint).toEqual({ x: METADATA.xMax, y: 42 });
      expect(scales.x.max).toBe(METADATA.xMax);
    });
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

    it('reports null when the pointer leaves, leaving the fallback to the caller', () => {
      const onHoverPrice = jest.fn();
      const { container } = renderBody({ onHoverPrice, currentPrice: 25 });

      fireEvent.mouseOut(
        container.querySelector('canvas') as HTMLCanvasElement,
      );

      expect(onHoverPrice).toHaveBeenCalledWith(null);
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
