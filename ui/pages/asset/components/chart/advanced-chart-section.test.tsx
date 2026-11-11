import React from 'react';
import { act, screen } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { AdvancedChartSection } from './advanced-chart-section';
import { useAdvancedChartData } from './useAdvancedChartData';
import { useAdvancedChartPreferences } from './useAdvancedChartPreferences';
import {
  CHART_TYPE_LINE,
  CHART_TYPE_CANDLE,
} from './advanced-chart-interval-bar';

jest.mock('../../hooks/useHistoricalPrices');
jest.mock('./useAdvancedChartData');
jest.mock('./useAdvancedChartPreferences');

// The iframe loads a cross-origin chart engine that cannot run under jsdom, so
// stand in for it and expose the props the section is responsible for wiring.
jest.mock('./advanced-chart-iframe', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop flag
  __esModule: true,
  default: ({
    assetId,
    selectedInterval,
    onError,
    onReady,
  }: {
    assetId: string;
    selectedInterval: string;
    onError: (error: string) => void;
    onReady: () => void;
  }) => (
    <div
      data-testid="chart-iframe"
      data-asset={assetId}
      data-interval={selectedInterval}
    >
      <button type="button" data-testid="simulate-ready" onClick={onReady} />
      <button
        type="button"
        data-testid="simulate-error"
        onClick={() => onError('boom')}
      />
    </div>
  ),
}));

jest.mock('./asset-chart-body', () => ({
  AssetChartBody: ({
    prices,
    realtimePrice,
    onHoverPrice,
    lineColorVar,
  }: {
    prices: { x: number; y: number }[];
    realtimePrice?: number;
    onHoverPrice: (point: { price?: number; date?: number } | null) => void;
    lineColorVar?: string;
  }) => (
    <div
      data-testid="line-chart"
      data-points={prices.length}
      data-realtime={realtimePrice ?? ''}
      data-line-color={lineColorVar ?? ''}
    >
      <button
        type="button"
        data-testid="simulate-hover"
        onClick={() => onHoverPrice({ price: 42, date: 1_700_000_000_000 })}
      />
      <button
        type="button"
        data-testid="simulate-unhover"
        onClick={() => onHoverPrice(null)}
      />
    </div>
  ),
}));

const mockUseHistoricalPrices = jest.mocked(useHistoricalPrices);
const mockUseAdvancedChartData = jest.mocked(useAdvancedChartData);
const mockUseAdvancedChartPreferences = jest.mocked(
  useAdvancedChartPreferences,
);

const setChartType = jest.fn();
const setCandleInterval = jest.fn();
const setLineTimeRange = jest.fn();

const PRICES = [
  { x: 1_699_000_000_000, y: 100 },
  { x: 1_700_000_000_000, y: 150 },
];

function setupPreferences(
  chartType: number = CHART_TYPE_LINE,
  overrides: { interval?: string } = {},
) {
  mockUseAdvancedChartPreferences.mockReturnValue({
    chartType,
    interval: overrides.interval ?? '15m',
    lineTimeRange: '1D',
    indicators: new Set<string>(),
    setChartType,
    setCandleInterval,
    setLineTimeRange,
    toggleIndicator: jest.fn(),
    isLineChart: chartType === CHART_TYPE_LINE,
  } as unknown as ReturnType<typeof useAdvancedChartPreferences>);
}

/** One candle, so the default candle-mode state is "has data" (shows chart). */
const MOCK_OHLCV_BAR = {
  time: 1_700_000_000,
  open: 1,
  high: 2,
  low: 0.5,
  close: 1.5,
  volume: 100,
};

function setupData(
  overrides: Partial<ReturnType<typeof useAdvancedChartData>> = {},
) {
  mockUseAdvancedChartData.mockReturnValue({
    ohlcvData: [MOCK_OHLCV_BAR],
    realtimeBar: undefined,
    realtimePrice: undefined,
    realtimeTimestamp: undefined,
    price: undefined,
    percentChange: undefined,
    timestamp: undefined,
    isLoading: false,
    error: null,
    resolvedCurrency: 'eur',
    fetchOlderBars: jest.fn().mockResolvedValue({ bars: [], noData: true }),
    ...overrides,
  });
}

function setupHistorical(
  overrides: Partial<ReturnType<typeof useHistoricalPrices>> = {},
) {
  mockUseHistoricalPrices.mockReturnValue({
    data: { prices: PRICES, metadata: {} },
    loading: false,
    isFetching: false,
    isPlaceholderData: false,
    ...overrides,
  } as unknown as ReturnType<typeof useHistoricalPrices>);
}

const DEFAULT_PROPS = {
  chainId: '0x1' as Hex,
  address: '0x0000000000000000000000000000000000000000',
  caipAssetId: 'eip155:1/slip44:60',
  currency: 'EUR',
  currentPrice: 200,
};

/** Whether a stacked chart slot is the one currently on screen. */
function isSlotVisible(testId: string): boolean {
  return screen.getByTestId(testId).style.visibility !== 'hidden';
}

/** Visibility of the indicator bar's reserved slot in candle mode. */
function indicatorSlotVisibility(): string {
  return screen.getByTestId('advanced-chart-indicator-slot').style.visibility;
}

function render(
  props: Partial<typeof DEFAULT_PROPS> = {},
  { themingEnabled = false }: { themingEnabled?: boolean } = {},
) {
  const store = configureStore({
    metamask: {
      currentLocale: 'en',
      remoteFeatureFlags: {
        tokenDetailsAdvancedChartsTheming: themingEnabled,
      },
    },
  });
  return renderWithProvider(
    <AdvancedChartSection {...DEFAULT_PROPS} {...props} />,
    store,
  );
}

/** The CSS variable the line chart was told to draw itself in. */
function lineColor(): string | null {
  return screen.getByTestId('line-chart').getAttribute('data-line-color');
}

describe('AdvancedChartSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupPreferences();
    setupData();
    setupHistorical();
  });

  describe('line mode', () => {
    it('renders the legacy chart on historical prices, not the candle iframe', () => {
      render();

      expect(screen.getByTestId('line-chart')).toHaveAttribute(
        'data-points',
        '2',
      );
      expect(screen.queryByTestId('chart-iframe')).not.toBeInTheDocument();
    });

    it('fetches historical prices for the selected range and skips the candle history', () => {
      render();

      expect(mockUseHistoricalPrices).toHaveBeenCalledWith(
        expect.objectContaining({ timeRange: 'P1D', enabled: true }),
      );
      expect(mockUseAdvancedChartData).toHaveBeenCalledWith(
        expect.objectContaining({ needsHistory: false }),
      );
    });

    it('offers the line time ranges rather than the candle intervals', () => {
      render();

      expect(screen.getByText('1H')).toBeInTheDocument();
      expect(screen.getByText('1Y')).toBeInTheDocument();
      expect(screen.queryByText('4h')).not.toBeInTheDocument();
    });

    it('feeds the live price into the legacy chart', () => {
      setupData({ realtimePrice: 175, realtimeTimestamp: 1_700_000_100_000 });
      render();

      expect(screen.getByTestId('line-chart')).toHaveAttribute(
        'data-realtime',
        '175',
      );
    });

    it('hides the indicator bar, since studies are candlestick-only', () => {
      render();

      expect(
        screen.queryByTestId('advanced-chart-indicator-slot'),
      ).not.toBeInTheDocument();
    });
  });

  describe('line mode header', () => {
    it('anchors the change to the first price of the displayed range', () => {
      // Opened at 100, live at 150: the header must agree with the plotted line
      // rather than with some other range's opening price.
      setupData({ realtimePrice: 150 });
      render();

      expect(screen.getByText('+50.00%')).toBeInTheDocument();
    });

    it('prefers the live price over the wallet-wide current price', () => {
      setupData({ realtimePrice: 150 });
      render();

      expect(screen.queryByText('+100.00%')).not.toBeInTheDocument();
    });

    it('shows the hovered point while hovering and the live price after', () => {
      setupData({ realtimePrice: 150 });
      render();

      act(() => {
        screen.getByTestId('simulate-hover').click();
      });
      // Hovered at 42 against an opening price of 100.
      expect(screen.getByText('-58.00%')).toBeInTheDocument();

      act(() => {
        screen.getByTestId('simulate-unhover').click();
      });
      expect(screen.getByText('+50.00%')).toBeInTheDocument();
    });

    it('does not anchor to placeholder data from the previous range', () => {
      setupHistorical({ isPlaceholderData: true });
      setupData({ realtimePrice: 150 });
      render();

      expect(screen.queryByText('+50.00%')).not.toBeInTheDocument();
    });
  });

  describe('line color', () => {
    it('always draws the line green when the theming flag is off', () => {
      // Range is down (live 50 against an opening price of 100) but the flag is
      // off, so the colour must not change.
      setupData({ realtimePrice: 50 });
      render();

      expect(lineColor()).toBe('--color-success-default');
    });

    it('draws the line green for an up range when the flag is on', () => {
      setupData({ realtimePrice: 150 });
      render({}, { themingEnabled: true });

      expect(lineColor()).toBe('--color-success-default');
    });

    it('draws the line red for a down range when the flag is on', () => {
      setupData({ realtimePrice: 50 });
      render({}, { themingEnabled: true });

      expect(lineColor()).toBe('--color-error-default');
    });

    it('falls back to green when the direction is unknown', () => {
      // Placeholder data has no trustworthy opening price to compare against.
      setupHistorical({ isPlaceholderData: true });
      setupData({ realtimePrice: 50 });
      render({}, { themingEnabled: true });

      expect(lineColor()).toBe('--color-success-default');
    });

    it('colors by the range direction, not the hovered point', () => {
      // Hovering a point below the opening price must not flip an up range red.
      setupData({ realtimePrice: 150 });
      render({}, { themingEnabled: true });

      act(() => {
        screen.getByTestId('simulate-hover').click();
      });

      expect(lineColor()).toBe('--color-success-default');
    });
  });

  describe('candle mode', () => {
    beforeEach(() => {
      setupPreferences(CHART_TYPE_CANDLE);
    });

    it('shows the iframe and hides the legacy chart', () => {
      render();

      expect(screen.getByTestId('chart-iframe')).toBeInTheDocument();
      expect(isSlotVisible('advanced-chart-frame')).toBe(true);
      expect(isSlotVisible('legacy-chart-slot')).toBe(false);
    });

    it('fetches the candle history and skips the historical prices', () => {
      render();

      expect(mockUseAdvancedChartData).toHaveBeenCalledWith(
        expect.objectContaining({ needsHistory: true }),
      );
      expect(mockUseHistoricalPrices).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it('offers the candle intervals', () => {
      render();

      expect(screen.getByText('4h')).toBeInTheDocument();
      expect(screen.queryByText('1Y')).not.toBeInTheDocument();
    });

    it('labels the header with the currency the data actually came back in', () => {
      // The price API does not quote every fiat, so a request in one currency
      // can legitimately come back in another.
      setupData({ price: 1234, resolvedCurrency: 'usd' });
      render({ currency: 'XYZ' });

      expect(screen.getByText(/\$1,234/u)).toBeInTheDocument();
    });

    it('reveals the indicator bar only once the engine reports ready', () => {
      render();

      expect(indicatorSlotVisibility()).toBe('hidden');

      act(() => {
        screen.getByTestId('simulate-ready').click();
      });

      expect(indicatorSlotVisibility()).toBe('visible');
    });

    it('keeps the indicator bar in the layout while hidden, so the chart above it does not resize', () => {
      render();

      expect(
        screen.getByTestId('advanced-chart-indicator-bar'),
      ).toBeInTheDocument();
      expect(indicatorSlotVisibility()).toBe('hidden');
    });

    it('shows a placeholder instead of the iframe for an unidentifiable asset', () => {
      render({ caipAssetId: undefined });

      expect(screen.queryByTestId('chart-iframe')).not.toBeInTheDocument();
    });
  });

  describe('deferring the iframe', () => {
    it('does not mount the chart engine for users who stay in line mode', () => {
      render();

      expect(screen.queryByTestId('chart-iframe')).not.toBeInTheDocument();
    });

    it('keeps the engine mounted across a round trip through line mode', () => {
      setupPreferences(CHART_TYPE_CANDLE);
      const { rerender } = render();
      const engine = screen.getByTestId('chart-iframe');

      setupPreferences(CHART_TYPE_LINE);
      rerender(<AdvancedChartSection {...DEFAULT_PROPS} />);
      expect(isSlotVisible('advanced-chart-frame')).toBe(false);

      setupPreferences(CHART_TYPE_CANDLE);
      rerender(<AdvancedChartSection {...DEFAULT_PROPS} />);
      expect(isSlotVisible('advanced-chart-frame')).toBe(true);
      // Same node throughout: a remount would replay the whole TradingView
      // boot and put the loading skeleton back on screen.
      expect(screen.getByTestId('chart-iframe')).toBe(engine);
    });

    it('hides the indicator bar in line mode even though the frame stays mounted', () => {
      setupPreferences(CHART_TYPE_CANDLE);
      const { rerender } = render();
      act(() => {
        screen.getByTestId('simulate-ready').click();
      });
      expect(indicatorSlotVisibility()).toBe('visible');

      setupPreferences(CHART_TYPE_LINE);
      rerender(<AdvancedChartSection {...DEFAULT_PROPS} />);

      // Studies are candlestick-only, and `visible` on a descendant beats
      // `hidden` on the frame, so this has to be switched off explicitly.
      expect(indicatorSlotVisibility()).toBe('hidden');
    });
  });

  describe('following the panel width', () => {
    it('lets the shared cell shrink past the width the charts last measured', () => {
      setupPreferences(CHART_TYPE_CANDLE);
      render();

      const legacySlot = screen.getByTestId('legacy-chart-slot');
      const frame = screen.getByTestId('advanced-chart-frame');

      // Without these the cell is floored at its items' min-content, and
      // Chart.js writes a pixel width onto its canvas, so narrowing the side
      // panel would push the whole page wider instead of resizing the chart.
      expect(legacySlot.parentElement?.style.gridTemplateColumns).toBe(
        'minmax(0, 1fr)',
      );
      expect(legacySlot.style.minWidth).toBe('0');
      expect(frame.style.minWidth).toBe('0');
    });
  });

  describe('failure handling', () => {
    beforeEach(() => {
      setupPreferences(CHART_TYPE_CANDLE);
    });

    it('replaces the chart with an error state when the engine fails', () => {
      render();

      act(() => {
        screen.getByTestId('simulate-error').click();
      });

      expect(screen.queryByTestId('chart-iframe')).not.toBeInTheDocument();
      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();
    });

    it('shows the error state when the candle data fails to load', () => {
      setupData({ error: 'OHLCV API error: 500' });
      render();

      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();
    });

    it('hides the indicator bar while the chart is failed', () => {
      render();

      act(() => {
        screen.getByTestId('simulate-ready').click();
      });
      expect(indicatorSlotVisibility()).toBe('visible');

      act(() => {
        screen.getByTestId('simulate-error').click();
      });
      expect(indicatorSlotVisibility()).toBe('hidden');
    });

    it('retries on a new token rather than pinning the error for the session', () => {
      const { rerender } = render();

      act(() => {
        screen.getByTestId('simulate-error').click();
      });
      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();

      rerender(
        <AdvancedChartSection
          {...DEFAULT_PROPS}
          caipAssetId="eip155:1/erc20:0xabc"
        />,
      );

      expect(screen.getByTestId('chart-iframe')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-error-state')).not.toBeInTheDocument();
    });

    it('retries on a new interval rather than pinning the error for the session', () => {
      const { rerender } = render();

      act(() => {
        screen.getByTestId('simulate-error').click();
      });
      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();

      setupPreferences(CHART_TYPE_CANDLE, { interval: '1d' });
      rerender(<AdvancedChartSection {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('chart-iframe')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-error-state')).not.toBeInTheDocument();
    });

    it('keeps the indicator bar visible after switching token', () => {
      // The iframe is not reloaded on a token change (its src is theme-only),
      // so the engine never re-emits CHART_READY. Readiness is a one-way latch,
      // mirroring mobile's `hasChartBeenRevealed`: once revealed, the bar stays
      // up across token/interval changes. Resetting it would hide the bar with
      // nothing to turn it back on.
      const { rerender } = render();
      act(() => {
        screen.getByTestId('simulate-ready').click();
      });
      expect(indicatorSlotVisibility()).toBe('visible');

      rerender(
        <AdvancedChartSection
          {...DEFAULT_PROPS}
          caipAssetId="eip155:1/erc20:0xabc"
        />,
      );

      expect(indicatorSlotVisibility()).toBe('visible');
    });
  });

  describe('empty candle history', () => {
    beforeEach(() => {
      setupPreferences(CHART_TYPE_CANDLE);
    });

    /**
     * Drives the component through a real fetch lifecycle: a loading pass (so
     * the empty result is recognised as a finished fetch, not the idle
     * pre-fetch state) followed by the settled state the test cares about.
     *
     * @param settled - The `useAdvancedChartData` return once the fetch lands.
     */
    function renderAfterFetch(
      settled: Partial<ReturnType<typeof useAdvancedChartData>>,
    ) {
      setupData({ ohlcvData: [], isLoading: true, error: null });
      const utils = render();
      setupData({ isLoading: false, error: null, ...settled });
      utils.rerender(<AdvancedChartSection {...DEFAULT_PROPS} />);
      return utils;
    }

    it('shows the no-data placeholder when a finished fetch returns no candles', () => {
      renderAfterFetch({ ohlcvData: [] });

      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-iframe')).not.toBeInTheDocument();
    });

    it('keeps showing the chart while the fetch is still loading, so the placeholder does not flash', () => {
      setupData({ ohlcvData: [], isLoading: true, error: null });
      render();

      expect(screen.getByTestId('chart-iframe')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-error-state')).not.toBeInTheDocument();
    });

    it('does not flash the placeholder on the idle frame before the fetch starts', () => {
      // Mirrors a line→candle switch: the hook is briefly idle with no data and
      // isLoading false before its fetch effect runs. That must render the
      // chart/skeleton, never the no-data placeholder.
      setupData({ ohlcvData: [], isLoading: false, error: null });
      render();

      expect(screen.getByTestId('chart-iframe')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-error-state')).not.toBeInTheDocument();
    });

    it('hides the indicator bar when there is no data', () => {
      renderAfterFetch({ ohlcvData: [] });

      expect(indicatorSlotVisibility()).toBe('hidden');
    });

    it('recovers to the chart once candles arrive', () => {
      const { rerender } = renderAfterFetch({ ohlcvData: [] });
      expect(screen.getByTestId('chart-error-state')).toBeInTheDocument();

      setupData({ ohlcvData: [MOCK_OHLCV_BAR], isLoading: false, error: null });
      rerender(<AdvancedChartSection {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('chart-iframe')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-error-state')).not.toBeInTheDocument();
    });
  });
});
