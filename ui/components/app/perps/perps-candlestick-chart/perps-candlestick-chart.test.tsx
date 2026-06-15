import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import PerpsCandlestickChart from './perps-candlestick-chart';

const mockUseTheme = jest.fn();
jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

type CrosshairParam = {
  paneIndex?: number;
  point?: { x: number; y: number };
  time?: number;
  seriesData: Map<unknown, unknown>;
};

let mockCrosshairCallback: ((param: CrosshairParam) => void) | undefined;
let mockCreatedSeries: { ref: object }[] = [];

jest.mock('lightweight-charts', () => ({
  createChart: () => {
    mockCreatedSeries = [];
    return {
      addSeries: () => {
        const series = {
          ref: {},
          setData: jest.fn(),
          update: jest.fn(),
          createPriceLine: jest.fn().mockReturnValue({ options: jest.fn() }),
          removePriceLine: jest.fn(),
          priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
          applyOptions: jest.fn(),
        };
        mockCreatedSeries.push(series);
        return series;
      },
      applyOptions: jest.fn(),
      timeScale: jest.fn().mockReturnValue({
        fitContent: jest.fn(),
        scrollToPosition: jest.fn(),
        scrollToRealTime: jest.fn(),
        getVisibleLogicalRange: jest.fn(),
        setVisibleLogicalRange: jest.fn(),
        subscribeVisibleLogicalRangeChange: jest.fn(),
        unsubscribeVisibleLogicalRangeChange: jest.fn(),
        applyOptions: jest.fn(),
      }),
      panes: jest
        .fn()
        .mockReturnValue([{ getHeight: () => 200 }, { getHeight: () => 60 }]),
      priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
      resize: jest.fn(),
      remove: jest.fn(),
      subscribeCrosshairMove: jest.fn((cb) => {
        mockCrosshairCallback = cb;
      }),
      unsubscribeCrosshairMove: jest.fn(),
    };
  },
  CandlestickSeries: 'CandlestickSeries',
  HistogramSeries: 'HistogramSeries',
  ColorType: { Solid: 'Solid' },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2, Solid: 0 },
  PriceScaleMode: { Normal: 0 },
}));

const mockStore = configureStore({
  metamask: { ...mockState.metamask },
});

// The component creates the candlestick series first, then the volume series.
const getCandlestickSeries = () => mockCreatedSeries[0];
const getVolumeSeries = () => mockCreatedSeries[1];

const buildSeriesDataMap = (volumeValue?: number, candle?: object) => {
  const map = new Map<unknown, unknown>();
  if (volumeValue !== undefined) {
    map.set(getVolumeSeries(), { value: volumeValue });
  }
  if (candle) {
    map.set(getCandlestickSeries(), candle);
  }
  return map;
};

describe('PerpsCandlestickChart — volume axis label on hover (TAT-2970)', () => {
  beforeEach(() => {
    mockCrosshairCallback = undefined;
    mockCreatedSeries = [];
    mockUseTheme.mockReturnValue('light');
  });

  it('renders the volume axis label overlay element with the expected testId', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    const label = screen.getByTestId('perps-volume-axis-label');
    expect(label).toBeInTheDocument();
  });

  it('starts with the volume label hidden', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    const label = screen.getByTestId('perps-volume-axis-label');
    expect(label.style.display).toBe('none');
  });

  it('shows the formatted volume when the cursor hovers the volume pane on a bar with positive volume', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    expect(mockCrosshairCallback).toBeDefined();

    mockCrosshairCallback?.({
      paneIndex: 1,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(14_900_000),
    });

    const label = screen.getByTestId('perps-volume-axis-label');
    expect(label.style.display).toBe('block');
    // formatVolume(14_900_000, 1) → "$14.9M"
    expect(label.textContent).toBe('$14.9M');
  });

  it('positions the label using cumulative pane heights + the in-pane y offset', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    expect(mockCrosshairCallback).toBeDefined();

    mockCrosshairCallback?.({
      paneIndex: 1,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(2_600_000),
    });

    const label = screen.getByTestId('perps-volume-axis-label');
    // pane 0 height (200) + 1px separator + in-pane y (40) = 241
    expect(label.style.top).toBe('241px');
  });

  it('hides the label when the cursor is in the candle pane (paneIndex 0)', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    expect(mockCrosshairCallback).toBeDefined();

    // First show the label
    mockCrosshairCallback?.({
      paneIndex: 1,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(2_600_000),
    });
    expect(screen.getByTestId('perps-volume-axis-label').style.display).toBe(
      'block',
    );

    // Then move to the candle pane
    mockCrosshairCallback?.({
      paneIndex: 0,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(2_600_000, {
        open: 100,
        high: 110,
        low: 90,
        close: 105,
      }),
    });
    expect(screen.getByTestId('perps-volume-axis-label').style.display).toBe(
      'none',
    );
  });

  it('hides the label when the hovered volume bar has zero volume', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    expect(mockCrosshairCallback).toBeDefined();

    mockCrosshairCallback?.({
      paneIndex: 1,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(0),
    });

    expect(screen.getByTestId('perps-volume-axis-label').style.display).toBe(
      'none',
    );
  });

  it('hides the label when the cursor leaves the chart (no point)', () => {
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    expect(mockCrosshairCallback).toBeDefined();

    // Show it first
    mockCrosshairCallback?.({
      paneIndex: 1,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(2_600_000),
    });
    expect(screen.getByTestId('perps-volume-axis-label').style.display).toBe(
      'block',
    );

    // Crosshair leaves the chart area: no `point`, empty seriesData
    mockCrosshairCallback?.({
      paneIndex: undefined,
      point: undefined,
      time: undefined,
      seriesData: new Map(),
    });
    expect(screen.getByTestId('perps-volume-axis-label').style.display).toBe(
      'none',
    );
  });

  it('forwards the hovered candle (including volume) to onCrosshairMove when provided', () => {
    const onCrosshairMove = jest.fn();
    renderWithProvider(
      <PerpsCandlestickChart onCrosshairMove={onCrosshairMove} />,
      mockStore,
    );
    expect(mockCrosshairCallback).toBeDefined();

    mockCrosshairCallback?.({
      paneIndex: 0,
      point: { x: 100, y: 40 },
      time: 1_700_000_000,
      seriesData: buildSeriesDataMap(2_600_000, {
        open: 100,
        high: 110,
        low: 90,
        close: 105,
      }),
    });

    expect(onCrosshairMove).toHaveBeenCalledWith(
      expect.objectContaining({
        time: 1_700_000_000_000,
        open: '100',
        high: '110',
        low: '90',
        close: '105',
        volume: '2600000',
      }),
    );
  });

  it('reports null to onCrosshairMove when the crosshair leaves the chart', () => {
    const onCrosshairMove = jest.fn();
    renderWithProvider(
      <PerpsCandlestickChart onCrosshairMove={onCrosshairMove} />,
      mockStore,
    );
    expect(mockCrosshairCallback).toBeDefined();

    mockCrosshairCallback?.({
      paneIndex: undefined,
      point: undefined,
      time: undefined,
      seriesData: new Map(),
    });

    expect(onCrosshairMove).toHaveBeenCalledWith(null);
  });
});
