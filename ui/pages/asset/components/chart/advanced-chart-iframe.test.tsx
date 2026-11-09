import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import AdvancedChartIframe, {
  CHART_ORIGIN,
  CHART_ORIGIN_PRD,
  CHART_ORIGIN_UAT,
  getChartOrigin,
  LOAD_TIMEOUT_MS,
} from './advanced-chart-iframe';

// Mock dependencies
jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = jest.requireMock('../../../../hooks/useTheme')
  .useTheme as jest.Mock;

describe('getChartOrigin', () => {
  const originalChartOriginUrl = process.env.CHART_ORIGIN_URL;
  const originalEnvironment = process.env.METAMASK_ENVIRONMENT;

  afterEach(() => {
    process.env.CHART_ORIGIN_URL = originalChartOriginUrl;
    process.env.METAMASK_ENVIRONMENT = originalEnvironment;
  });

  it('prefers an explicit CHART_ORIGIN_URL override', () => {
    process.env.CHART_ORIGIN_URL = 'http://localhost:8001';
    process.env.METAMASK_ENVIRONMENT = 'production';

    expect(getChartOrigin()).toBe('http://localhost:8001');
  });

  it('uses the production origin for production and release-candidate builds', () => {
    delete process.env.CHART_ORIGIN_URL;

    process.env.METAMASK_ENVIRONMENT = 'production';
    expect(getChartOrigin()).toBe(CHART_ORIGIN_PRD);

    process.env.METAMASK_ENVIRONMENT = 'release-candidate';
    expect(getChartOrigin()).toBe(CHART_ORIGIN_PRD);
  });

  it('uses the UAT origin for non-production environments', () => {
    delete process.env.CHART_ORIGIN_URL;

    for (const environment of [
      'staging',
      'development',
      'testing',
      'pull-request',
      'other',
      undefined,
    ]) {
      process.env.METAMASK_ENVIRONMENT = environment;
      expect(getChartOrigin()).toBe(CHART_ORIGIN_UAT);
    }
  });
});

describe('AdvancedChartIframe', () => {
  const mockOHLCVData = [
    {
      time: 1700000000,
      open: 1,
      high: 2,
      low: 0.5,
      close: 1.5,
      volume: 100,
    },
    {
      time: 1700003600,
      open: 1.5,
      high: 3,
      low: 1,
      close: 2.5,
      volume: 200,
    },
  ];

  const defaultProps = {
    assetId: 'ethereum',
    chartType: 1, // Line chart
    selectedInterval: '15m',
    ohlcvData: mockOHLCVData,
  };

  let postMessageSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseTheme.mockReturnValue('light');

    // Mock iframe contentWindow.postMessage
    postMessageSpy = jest.fn();

    // Setup DOM iframe mock
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      writable: true,
      value: {
        postMessage: postMessageSpy,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the iframe wrapper with correct test id', () => {
      const { getByTestId } = render(<AdvancedChartIframe {...defaultProps} />);

      expect(getByTestId('advanced-chart-iframe')).toBeInTheDocument();
    });

    it('renders iframe with correct src for light theme', () => {
      mockUseTheme.mockReturnValue('light');
      const { container } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.src).toBe(`${CHART_ORIGIN}/index.html?theme=light`);
    });

    it('renders iframe with correct src for dark theme', () => {
      mockUseTheme.mockReturnValue('dark');
      const { container } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toBe(`${CHART_ORIGIN}/index.html?theme=dark`);
    });

    it('fills its container, leaving sizing to the parent', () => {
      const { getByTestId } = render(<AdvancedChartIframe {...defaultProps} />);

      expect(getByTestId('advanced-chart-iframe')).toHaveStyle({
        width: '100%',
        height: '100%',
      });
    });

    it('covers the iframe with a skeleton until the chart reports ready', () => {
      const { getByTestId, queryByTestId } = render(
        <AdvancedChartIframe {...defaultProps} />,
      );

      expect(getByTestId('advanced-chart-loading')).toBeInTheDocument();

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      expect(queryByTestId('advanced-chart-loading')).not.toBeInTheDocument();
    });

    it('renders iframe with correct title', () => {
      const { container } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.title).toBe('Advanced Chart');
    });

    it('renders iframe with specified styling', () => {
      const { container } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = container.querySelector('iframe');
      expect(iframe).toHaveStyle({
        width: '100%',
        height: '100%',
      });
    });
  });

  describe('OHLCV Data Prop Handling', () => {
    it('does not crash when no OHLCV data is available', () => {
      const { getByTestId } = render(
        <AdvancedChartIframe {...defaultProps} ohlcvData={[]} />,
      );

      expect(getByTestId('advanced-chart-iframe')).toBeInTheDocument();
    });

    it('renders with provided OHLCV data', () => {
      const { getByTestId } = render(<AdvancedChartIframe {...defaultProps} />);

      expect(getByTestId('advanced-chart-iframe')).toBeInTheDocument();
    });
  });

  describe('PostMessage Communication', () => {
    it('sends OHLCV data to iframe after iframe loads', async () => {
      const { container } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = container.querySelector('iframe');

      // Simulate iframe load
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: mockOHLCVData,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('sends chart type to iframe when chartReady is true', async () => {
      const { container } = render(
        <AdvancedChartIframe {...defaultProps} chartType={2} />,
      );

      const iframe = container.querySelector('iframe');

      // Simulate iframe load
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      // Simulate CHART_READY message
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_CHART_TYPE',
            payload: { type: 2 },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('updates chart type when chartType prop changes', async () => {
      const { container, rerender } = render(
        <AdvancedChartIframe {...defaultProps} chartType={1} />,
      );

      const iframe = container.querySelector('iframe');

      // Simulate iframe load and ready
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      postMessageSpy.mockClear();

      // Change chart type
      rerender(<AdvancedChartIframe {...defaultProps} chartType={2} />);

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_CHART_TYPE',
            payload: { type: 2 },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('does not send chart type before chartReady', () => {
      render(<AdvancedChartIframe {...defaultProps} chartType={2} />);

      expect(postMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('SET_CHART_TYPE'),
        expect.any(String),
      );
    });

    it('exposes postMessage via ref', () => {
      const ref = React.createRef<{
        postMessage: (msg: Record<string, unknown>) => void;
      }>();

      render(<AdvancedChartIframe {...defaultProps} ref={ref} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.postMessage).toBeInstanceOf(Function);
    });

    it('allows parent to send messages via ref', async () => {
      const ref = React.createRef<{
        postMessage: (msg: Record<string, unknown>) => void;
      }>();
      const { container } = render(
        <AdvancedChartIframe {...defaultProps} ref={ref} />,
      );

      const iframe = container.querySelector('iframe');
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      const testMessage = { type: 'TEST_MESSAGE', payload: { foo: 'bar' } };

      act(() => {
        ref.current?.postMessage(testMessage);
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify(testMessage),
          CHART_ORIGIN,
        );
      });
    });
  });

  describe('Indicator Syncing', () => {
    const CANDLE = 1;
    const LINE = 2;

    const renderReady = (
      activeIndicators?: Set<string>,
      chartType = CANDLE,
    ) => {
      const result = render(
        <AdvancedChartIframe
          {...defaultProps}
          chartType={chartType}
          activeIndicators={activeIndicators}
        />,
      );

      act(() => {
        result.container
          .querySelector('iframe')
          ?.dispatchEvent(new Event('load'));
      });

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      return result;
    };

    const expectPosted = (message: Record<string, unknown>) =>
      expect(postMessageSpy).toHaveBeenCalledWith(
        JSON.stringify(message),
        CHART_ORIGIN,
      );

    const expectNotPosted = (type: string) =>
      expect(postMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(type),
        expect.any(String),
      );

    it('applies the persisted selection once the chart is ready', async () => {
      renderReady(new Set(['RSI', 'MACD']));

      await waitFor(() => {
        expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } });
      });
      expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'MACD' } });
    });

    it('applies volume via TOGGLE_VOLUME rather than ADD_INDICATOR', async () => {
      renderReady(new Set(['Volume']));

      await waitFor(() => {
        expectPosted({
          type: 'TOGGLE_VOLUME',
          payload: { visible: true, volumeOverlay: true },
        });
      });
      expectNotPosted('ADD_INDICATOR');
    });

    it('applies moving averages as a single batch', async () => {
      renderReady(new Set(['MA20', 'RSI', 'MA50']));

      await waitFor(() => {
        expectPosted({
          type: 'SET_MA_VISIBILITY',
          payload: { visible: ['MA20', 'MA50'] },
        });
      });
      expectNotPosted('"name":"MA20"');
    });

    it('does not apply indicators before the chart is ready', () => {
      render(
        <AdvancedChartIframe
          {...defaultProps}
          activeIndicators={new Set(['RSI'])}
        />,
      );

      expectNotPosted('ADD_INDICATOR');
    });

    it('adds only the newly selected indicator when the selection grows', async () => {
      const { rerender } = renderReady(new Set(['RSI']));

      await waitFor(() => {
        expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } });
      });
      postMessageSpy.mockClear();

      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          chartType={CANDLE}
          activeIndicators={new Set(['RSI', 'MACD'])}
        />,
      );

      await waitFor(() => {
        expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'MACD' } });
      });
      expect(postMessageSpy).not.toHaveBeenCalledWith(
        JSON.stringify({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } }),
        CHART_ORIGIN,
      );
    });

    it('removes an indicator that is deselected', async () => {
      const { rerender } = renderReady(new Set(['RSI', 'MACD']));

      await waitFor(() => {
        expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'MACD' } });
      });
      postMessageSpy.mockClear();

      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          chartType={CANDLE}
          activeIndicators={new Set(['RSI'])}
        />,
      );

      await waitFor(() => {
        expectPosted({ type: 'REMOVE_INDICATOR', payload: { name: 'MACD' } });
      });
    });

    describe('Line chart', () => {
      it('applies no studies even when indicators are selected', () => {
        renderReady(new Set(['RSI', 'MA20', 'Volume']), LINE);

        expectNotPosted('ADD_INDICATOR');
        expectPosted({ type: 'SET_MA_VISIBILITY', payload: { visible: [] } });
        expectPosted({
          type: 'TOGGLE_VOLUME',
          payload: { visible: false, volumeOverlay: true },
        });
      });

      it('removes the studies when switching from candle to line', async () => {
        const { rerender } = renderReady(
          new Set(['RSI', 'MA20', 'Volume']),
          CANDLE,
        );

        await waitFor(() => {
          expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } });
        });
        postMessageSpy.mockClear();

        rerender(
          <AdvancedChartIframe
            {...defaultProps}
            chartType={LINE}
            activeIndicators={new Set(['RSI', 'MA20', 'Volume'])}
          />,
        );

        await waitFor(() => {
          expectPosted({ type: 'REMOVE_INDICATOR', payload: { name: 'RSI' } });
        });
        expectPosted({ type: 'SET_MA_VISIBILITY', payload: { visible: [] } });
        expectPosted({
          type: 'TOGGLE_VOLUME',
          payload: { visible: false, volumeOverlay: true },
        });
      });

      it('restores the studies when switching back to candle', async () => {
        const indicators = new Set(['RSI', 'MA20', 'Volume']);
        const { rerender } = renderReady(indicators, LINE);

        postMessageSpy.mockClear();

        rerender(
          <AdvancedChartIframe
            {...defaultProps}
            chartType={CANDLE}
            activeIndicators={indicators}
          />,
        );

        await waitFor(() => {
          expectPosted({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } });
        });
        expectPosted({
          type: 'SET_MA_VISIBILITY',
          payload: { visible: ['MA20'] },
        });
        expectPosted({
          type: 'TOGGLE_VOLUME',
          payload: { visible: true, volumeOverlay: true },
        });
      });
    });
  });

  describe('Message Event Handling', () => {
    it('handles CHART_READY message from iframe', async () => {
      const mockOnReady = jest.fn();

      render(<AdvancedChartIframe {...defaultProps} onReady={mockOnReady} />);

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      await waitFor(() => {
        expect(mockOnReady).toHaveBeenCalledTimes(1);
      });
    });

    it('handles ERROR message from iframe', async () => {
      const mockOnError = jest.fn();

      render(<AdvancedChartIframe {...defaultProps} onError={mockOnError} />);

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Chart rendering error' },
            }),
          }),
        );
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Chart rendering error');
      });
    });

    it('ignores messages from wrong origin', () => {
      const mockOnReady = jest.fn();
      const mockOnError = jest.fn();

      render(
        <AdvancedChartIframe
          {...defaultProps}
          onReady={mockOnReady}
          onError={mockOnError}
        />,
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'http://evil.com',
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      expect(mockOnReady).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('ignores non-JSON messages', () => {
      const mockOnError = jest.fn();

      render(<AdvancedChartIframe {...defaultProps} onError={mockOnError} />);

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: 'invalid json',
          }),
        );
      });

      // Should not crash or call error handler for malformed messages
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('handles messages with non-string data (already parsed)', () => {
      const mockOnReady = jest.fn();

      render(<AdvancedChartIframe {...defaultProps} onReady={mockOnReady} />);

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: { type: 'CHART_READY' }, // Already an object
          }),
        );
      });

      expect(mockOnReady).toHaveBeenCalledTimes(1);
    });

    it('cleans up message listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<AdvancedChartIframe {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
    });
  });

  describe('Load Timeout', () => {
    it('calls onError if CHART_READY not received within timeout', async () => {
      const mockOnError = jest.fn();

      render(<AdvancedChartIframe {...defaultProps} onError={mockOnError} />);

      act(() => {
        jest.advanceTimersByTime(LOAD_TIMEOUT_MS);
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Chart load timeout');
      });
    });

    it('does not call onError if CHART_READY received before timeout', async () => {
      const mockOnError = jest.fn();

      render(<AdvancedChartIframe {...defaultProps} onError={mockOnError} />);

      // Send CHART_READY before timeout
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      // Advance time past the timeout
      act(() => {
        jest.advanceTimersByTime(LOAD_TIMEOUT_MS);
      });

      // onError should only be called once (not for timeout)
      expect(mockOnError).not.toHaveBeenCalledWith('Chart load timeout');
    });

    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = render(<AdvancedChartIframe {...defaultProps} />);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('clears timeout when CHART_READY is received', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      render(<AdvancedChartIframe {...defaultProps} />);

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      await waitFor(() => {
        expect(clearTimeoutSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Series changes', () => {
    /** Loads the iframe and clears the resulting initial SET_OHLCV_DATA. */
    const renderLoaded = (props = {}) => {
      const result = render(
        <AdvancedChartIframe {...defaultProps} {...props} />,
      );
      act(() => {
        document.querySelector('iframe')?.dispatchEvent(new Event('load'));
      });
      postMessageSpy.mockClear();
      return result;
    };

    // Two tokens can easily return the same number of candles, so bar counts
    // alone cannot tell a new series from an incremental update.
    const sameLengthOtherValues = mockOHLCVData.map((bar) => ({
      ...bar,
      close: bar.close + 100,
    }));

    it('rebuilds the chart when the asset changes, even at an identical bar count', async () => {
      const { rerender } = renderLoaded();

      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          assetId="bitcoin"
          ohlcvData={sameLengthOtherValues}
        />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: sameLengthOtherValues,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('rebuilds the chart when the interval changes, even at an identical bar count', async () => {
      const { rerender } = renderLoaded();

      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          selectedInterval="1d"
          ohlcvData={sameLengthOtherValues}
        />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: sameLengthOtherValues,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('still sends a lightweight update when only the last bar moves', async () => {
      const { rerender } = renderLoaded();

      const tickedLastBar = [
        mockOHLCVData[0],
        { ...mockOHLCVData[1], close: 99 },
      ];
      rerender(
        <AdvancedChartIframe {...defaultProps} ohlcvData={tickedLastBar} />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'REALTIME_UPDATE',
            payload: { bar: tickedLastBar[1] },
          }),
          CHART_ORIGIN,
        );
      });
    });

    // The data lags the prop: `useOHLCVChart` keeps the previous series' bars
    // until the new fetch lands, so the asset changes a render before its bars
    // do. The stale bars get stamped under the new series for that render; the
    // real bars must still rebuild the chart, not tick a single candle.
    it('rebuilds when the new series bars arrive a render after the asset changes', async () => {
      const { rerender } = renderLoaded();

      // Render 1: asset switched, but the old asset's bars are still in hand.
      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          assetId="bitcoin"
          ohlcvData={mockOHLCVData}
        />,
      );
      postMessageSpy.mockClear();

      // Render 2: bitcoin's real bars land, at the same count as ethereum's.
      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          assetId="bitcoin"
          ohlcvData={sameLengthOtherValues}
        />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: sameLengthOtherValues,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
      expect(postMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('REALTIME_UPDATE'),
        CHART_ORIGIN,
      );
    });

    it('rebuilds when the display currency changes at an identical bar count', async () => {
      const { rerender } = renderLoaded({ currency: 'usd' });

      // The same window re-priced in another fiat: same timestamps and count,
      // every price different.
      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          currency="eur"
          ohlcvData={sameLengthOtherValues}
        />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: sameLengthOtherValues,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
      expect(postMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('REALTIME_UPDATE'),
        CHART_ORIGIN,
      );
    });
  });

  describe('Theme reload', () => {
    const chartReady = () =>
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

    // The theme is part of the iframe src, so changing it swaps the engine for
    // a bare one. Anything we believed was applied to the old engine is gone.
    it('re-applies indicators to the chart that replaces it', async () => {
      const { rerender, getByTestId } = render(
        <AdvancedChartIframe
          {...defaultProps}
          chartType={1}
          activeIndicators={new Set(['RSI'])}
        />,
      );
      chartReady();

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } }),
          CHART_ORIGIN,
        );
      });
      postMessageSpy.mockClear();

      mockUseTheme.mockReturnValue('dark');
      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          chartType={1}
          activeIndicators={new Set(['RSI'])}
        />,
      );

      // The replacement is not ready yet, so the skeleton is back and nothing
      // has been re-sent.
      expect(getByTestId('advanced-chart-loading')).toBeInTheDocument();

      chartReady();

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({ type: 'ADD_INDICATOR', payload: { name: 'RSI' } }),
          CHART_ORIGIN,
        );
      });
    });
  });

  describe('Data Flow', () => {
    it('sends new OHLCV data when data changes', async () => {
      const { rerender } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = document.querySelector('iframe');
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: mockOHLCVData,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });

      postMessageSpy.mockClear();

      // Change data — bulk change (diff > 1 bar triggers full SET_OHLCV_DATA)
      const newData = [
        {
          time: 1700010000,
          open: 2,
          high: 3,
          low: 1.5,
          close: 2.8,
          volume: 300,
        },
        {
          time: 1700013600,
          open: 2.8,
          high: 4,
          low: 2.5,
          close: 3.5,
          volume: 400,
        },
        {
          time: 1700017200,
          open: 3.5,
          high: 5,
          low: 3,
          close: 4.2,
          volume: 500,
        },
        {
          time: 1700020800,
          open: 4.2,
          high: 6,
          low: 4,
          close: 5.1,
          volume: 600,
        },
      ];

      rerender(<AdvancedChartIframe {...defaultProps} ohlcvData={newData} />);

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: newData,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('does not send empty OHLCV data', () => {
      const { container } = render(
        <AdvancedChartIframe {...defaultProps} ohlcvData={[]} />,
      );

      const iframe = container.querySelector('iframe');
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      expect(postMessageSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('SET_OHLCV_DATA'),
        expect.any(String),
      );
    });

    it('waits for iframe load before sending data', () => {
      render(<AdvancedChartIframe {...defaultProps} />);

      // Data should not be sent before iframe loads
      expect(postMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing contentWindow', async () => {
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        writable: true,
        value: null,
      });

      const ref = React.createRef<{
        postMessage: (msg: Record<string, unknown>) => void;
      }>();

      render(<AdvancedChartIframe {...defaultProps} ref={ref} />);

      // Should not crash
      expect(() => {
        ref.current?.postMessage({ type: 'TEST' });
      }).not.toThrow();
    });

    it('handles rapid theme changes', () => {
      const { rerender, container } = render(
        <AdvancedChartIframe {...defaultProps} />,
      );

      mockUseTheme.mockReturnValue('dark');
      rerender(<AdvancedChartIframe {...defaultProps} />);

      mockUseTheme.mockReturnValue('light');
      rerender(<AdvancedChartIframe {...defaultProps} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toBe(`${CHART_ORIGIN}/index.html?theme=light`);
    });

    it('handles simultaneous prop changes', async () => {
      const { rerender } = render(<AdvancedChartIframe {...defaultProps} />);

      const iframe = document.querySelector('iframe');
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      postMessageSpy.mockClear();

      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          assetId="bitcoin"
          selectedInterval="1h"
          chartType={2}
        />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalled();
      });
    });

    it('handles null or undefined callback props gracefully', () => {
      const { container } = render(
        <AdvancedChartIframe
          {...defaultProps}
          onError={undefined}
          onReady={undefined}
        />,
      );

      // Send CHART_READY
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      // Send ERROR
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({
              type: 'ERROR',
              payload: { message: 'test error' },
            }),
          }),
        );
      });

      // Should not crash
      expect(container).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('handles complete lifecycle: load → ready → data → type change', async () => {
      const mockOnReady = jest.fn();
      const mockOnError = jest.fn();

      const { container, rerender } = render(
        <AdvancedChartIframe
          {...defaultProps}
          onReady={mockOnReady}
          onError={mockOnError}
        />,
      );

      // 1. Iframe loads
      const iframe = container.querySelector('iframe');
      act(() => {
        iframe?.dispatchEvent(new Event('load'));
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: mockOHLCVData,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });

      // 2. Chart becomes ready
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });

      expect(mockOnReady).toHaveBeenCalledTimes(1);

      postMessageSpy.mockClear();

      // 3. Chart type changes
      rerender(
        <AdvancedChartIframe
          {...defaultProps}
          chartType={2}
          onReady={mockOnReady}
          onError={mockOnError}
        />,
      );

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_CHART_TYPE',
            payload: { type: 2 },
          }),
          CHART_ORIGIN,
        );
      });

      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('Host-backed pagination', () => {
    const loadAndReady = (props = {}) => {
      const result = render(
        <AdvancedChartIframe {...defaultProps} {...props} />,
      );
      act(() => {
        result.container
          .querySelector('iframe')
          ?.dispatchEvent(new Event('load'));
      });
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({ type: 'CHART_READY' }),
          }),
        );
      });
      postMessageSpy.mockClear();
      return result;
    };

    const requestOlderBars = (requestId: string, seriesGeneration: number) => {
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: CHART_ORIGIN,
            data: JSON.stringify({
              type: 'FETCH_OLDER_BARS_REQUEST',
              payload: { requestId, seriesGeneration },
            }),
          }),
        );
      });
    };

    it('turns host-backed pagination on in the SET_OHLCV_DATA payload', async () => {
      const { container } = render(<AdvancedChartIframe {...defaultProps} />);
      act(() => {
        container.querySelector('iframe')?.dispatchEvent(new Event('load'));
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: {
              data: mockOHLCVData,
              rnBackedPagination: { enabled: true },
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('answers a request with the fetched page, echoing requestId and seriesGeneration', async () => {
      const olderBars = [
        { time: 1699900000, open: 1, high: 1, low: 1, close: 1, volume: 1 },
      ];
      const fetchOlderBars = jest
        .fn()
        .mockResolvedValue({ bars: olderBars, noData: false });

      loadAndReady({ fetchOlderBars });
      requestOlderBars('obr-7', 4);

      await waitFor(() => {
        expect(fetchOlderBars).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'FETCH_OLDER_BARS_RESPONSE',
            payload: {
              requestId: 'obr-7',
              seriesGeneration: 4,
              bars: olderBars,
              noData: false,
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('replies noData when the older-bars fetch rejects', async () => {
      const fetchOlderBars = jest
        .fn()
        .mockRejectedValue(new Error('network down'));

      loadAndReady({ fetchOlderBars });
      requestOlderBars('obr-8', 5);

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'FETCH_OLDER_BARS_RESPONSE',
            payload: {
              requestId: 'obr-8',
              seriesGeneration: 5,
              bars: [],
              noData: true,
              error: 'network down',
            },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('replies noData when no pagination callback is wired', async () => {
      loadAndReady();
      requestOlderBars('obr-9', 6);

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'FETCH_OLDER_BARS_RESPONSE',
            payload: {
              requestId: 'obr-9',
              seriesGeneration: 6,
              bars: [],
              noData: true,
            },
          }),
          CHART_ORIGIN,
        );
      });
    });
  });
});
