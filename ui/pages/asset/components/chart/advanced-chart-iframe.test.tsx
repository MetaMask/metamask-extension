import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import AdvancedChartIframe from './advanced-chart-iframe';
import { useOHLCVChart } from './useOHLCVChart';

// Mock dependencies
jest.mock('./useOHLCVChart');
jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

const mockUseOHLCVChart = useOHLCVChart as jest.MockedFunction<
  typeof useOHLCVChart
>;
const mockUseTheme = jest.requireMock('../../../../hooks/useTheme')
  .useTheme as jest.Mock;

const CHART_ORIGIN = 'http://localhost:8001';

describe('AdvancedChartIframe', () => {
  const defaultProps = {
    assetId: 'ethereum',
    height: 300,
    chartType: 1, // Line chart
    selectedInterval: '15m',
  };

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

  let postMessageSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseTheme.mockReturnValue('light');
    mockUseOHLCVChart.mockReturnValue({
      ohlcvData: mockOHLCVData,
      error: null,
      isLoading: false,
    });

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

    it('renders with custom height', () => {
      const { getByTestId } = render(
        <AdvancedChartIframe {...defaultProps} height={500} />,
      );

      const wrapper = getByTestId('advanced-chart-iframe');
      expect(wrapper).toHaveStyle({ height: '500px' });
    });

    it('renders with default height when not provided', () => {
      const { height, ...propsWithoutHeight } = defaultProps;
      const { getByTestId } = render(
        <AdvancedChartIframe {...propsWithoutHeight} />,
      );

      const wrapper = getByTestId('advanced-chart-iframe');
      expect(wrapper).toHaveStyle({ height: '300px' });
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

  describe('OHLCV Data Hook Integration', () => {
    it('calls useOHLCVChart with correct parameters', () => {
      render(<AdvancedChartIframe {...defaultProps} />);

      expect(mockUseOHLCVChart).toHaveBeenCalledWith({
        assetId: 'ethereum',
        interval: '15m',
      });
    });

    it('updates OHLCV hook call when assetId changes', () => {
      const { rerender } = render(<AdvancedChartIframe {...defaultProps} />);

      rerender(<AdvancedChartIframe {...defaultProps} assetId="bitcoin" />);

      expect(mockUseOHLCVChart).toHaveBeenLastCalledWith({
        assetId: 'bitcoin',
        interval: '15m',
      });
    });

    it('updates OHLCV hook call when interval changes', () => {
      const { rerender } = render(<AdvancedChartIframe {...defaultProps} />);

      rerender(<AdvancedChartIframe {...defaultProps} selectedInterval="1h" />);

      expect(mockUseOHLCVChart).toHaveBeenLastCalledWith({
        assetId: 'ethereum',
        interval: '1h',
      });
    });

    it('calls onError when OHLCV hook returns an error', () => {
      const mockOnError = jest.fn();
      mockUseOHLCVChart.mockReturnValue({
        ohlcvData: [],
        error: 'Failed to fetch OHLCV data',
        isLoading: false,
      });

      render(<AdvancedChartIframe {...defaultProps} onError={mockOnError} />);

      expect(mockOnError).toHaveBeenCalledWith('Failed to fetch OHLCV data');
    });

    it('does not crash when no OHLCV data is available', () => {
      mockUseOHLCVChart.mockReturnValue({
        ohlcvData: [],
        error: null,
        isLoading: false,
      });

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
            payload: { data: mockOHLCVData },
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

      // Advance time past the timeout (10 seconds)
      act(() => {
        jest.advanceTimersByTime(10_000);
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
        jest.advanceTimersByTime(10_000);
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
            payload: { data: mockOHLCVData },
          }),
          CHART_ORIGIN,
        );
      });

      postMessageSpy.mockClear();

      // Change data
      const newData = [
        {
          time: 1700010000,
          open: 2,
          high: 3,
          low: 1.5,
          close: 2.8,
          volume: 300,
        },
      ];

      mockUseOHLCVChart.mockReturnValue({
        ohlcvData: newData,
        error: null,
        isLoading: false,
      });

      rerender(<AdvancedChartIframe {...defaultProps} />);

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'SET_OHLCV_DATA',
            payload: { data: newData },
          }),
          CHART_ORIGIN,
        );
      });
    });

    it('does not send empty OHLCV data', () => {
      mockUseOHLCVChart.mockReturnValue({
        ohlcvData: [],
        error: null,
        isLoading: false,
      });

      const { container } = render(<AdvancedChartIframe {...defaultProps} />);

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
            payload: { data: mockOHLCVData },
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
});
