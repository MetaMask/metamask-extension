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
let mockCreatedCharts: { panes: jest.Mock; remove: jest.Mock }[] = [];

jest.mock('lightweight-charts', () => ({
  createChart: () => {
    mockCreatedSeries = [];
    const chart = {
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
      panes: jest.fn().mockReturnValue([
        { getHeight: () => 200, setHeight: jest.fn() },
        { getHeight: () => 60, setHeight: jest.fn() },
      ]),
      priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
      resize: jest.fn(),
      remove: jest.fn(),
      subscribeCrosshairMove: jest.fn((cb) => {
        mockCrosshairCallback = cb;
      }),
      unsubscribeCrosshairMove: jest.fn(),
    };
    mockCreatedCharts.push(chart);
    return chart;
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

// Comfortably past the component's 50ms pane-height timer.
const PANE_HEIGHT_TIMER_OVERRUN_MS = 100;

// The component's default height is 250px, split 80/20 between the candle pane
// and the volume pane. Pinning both values catches a MAIN/VOLUME swap.
const DEFAULT_MAIN_PANE_HEIGHT = 200;
const DEFAULT_VOLUME_PANE_HEIGHT = 50;

// The panes array the chart handed back, so pane sizing can be asserted without
// calling panes() again and perturbing the call count.
const getPanesOf = (chart?: { panes: jest.Mock }) =>
  chart?.panes.mock.results[0]?.value as { setHeight: jest.Mock }[];

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

describe('PerpsCandlestickChart — chart disposal (TAT-3462)', () => {
  beforeEach(() => {
    mockCrosshairCallback = undefined;
    mockCreatedSeries = [];
    mockCreatedCharts = [];
    mockUseTheme.mockReturnValue('light');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not apply pane heights after the chart has been disposed on unmount', () => {
    // Arrange
    const { unmount } = renderWithProvider(
      <PerpsCandlestickChart />,
      mockStore,
    );
    const chart = mockCreatedCharts.at(-1);
    expect(chart).toBeDefined();
    expect(chart?.panes).not.toHaveBeenCalled();

    // Act — unmount before the pane-height timer fires, then let it come due
    unmount();
    jest.advanceTimersByTime(PANE_HEIGHT_TIMER_OVERRUN_MS);

    // Assert — the chart was disposed and the timer never touched it afterwards
    expect(chart?.remove).toHaveBeenCalledTimes(1);
    expect(chart?.panes).not.toHaveBeenCalled();
  });

  it('applies the 80/20 pane split when the chart stays mounted past the timer', () => {
    // Arrange
    renderWithProvider(<PerpsCandlestickChart />, mockStore);
    const chart = mockCreatedCharts.at(-1);

    // Act
    jest.advanceTimersByTime(PANE_HEIGHT_TIMER_OVERRUN_MS);

    // Assert — clearing the timer on unmount must not break the normal path, and
    // the candle pane gets 80% of the default 250px height while volume gets 20%.
    expect(chart?.panes).toHaveBeenCalled();
    const panes = getPanesOf(chart);
    expect(panes[0].setHeight).toHaveBeenCalledWith(DEFAULT_MAIN_PANE_HEIGHT);
    expect(panes[1].setHeight).toHaveBeenCalledWith(DEFAULT_VOLUME_PANE_HEIGHT);
  });

  it('disposes the previous chart and drops its pending pane-height timer when the theme changes', () => {
    // Arrange — the init effect re-runs on theme change, which the component
    // names as the real-world trigger for a timer outliving its chart.
    mockUseTheme.mockReturnValue('light');
    const { rerender } = renderWithProvider(
      <PerpsCandlestickChart />,
      mockStore,
    );
    const firstChart = mockCreatedCharts.at(-1);

    // Act — flip the theme before the first chart's pane-height timer comes due
    mockUseTheme.mockReturnValue('dark');
    rerender(<PerpsCandlestickChart />);
    jest.advanceTimersByTime(PANE_HEIGHT_TIMER_OVERRUN_MS);

    // Assert — old chart disposed and its timer never fired; new chart still sized
    expect(mockCreatedCharts).toHaveLength(2);
    const secondChart = mockCreatedCharts.at(-1);
    expect(firstChart?.remove).toHaveBeenCalledTimes(1);
    expect(firstChart?.panes).not.toHaveBeenCalled();
    expect(secondChart?.panes).toHaveBeenCalled();
    const panes = getPanesOf(secondChart);
    expect(panes[0].setHeight).toHaveBeenCalledWith(DEFAULT_MAIN_PANE_HEIGHT);
    expect(panes[1].setHeight).toHaveBeenCalledWith(DEFAULT_VOLUME_PANE_HEIGHT);
  });
});
