import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTheme } from '../../../../hooks/useTheme';
import { useOHLCVChart } from './useOHLCVChart';
import type { OHLCVRealtimeBar } from './useOHLCVRealtime';

/**
 * [POC — THROWAWAY] AdvancedChartIframe
 *
 * Pure chart embed — just the cross-origin iframe + postMessage bridge.
 * Mirrors mobile's AdvancedChart.tsx (the WebView component only).
 *
 * All toolbar UI (IntervalBar, IndicatorBar) lives in separate components
 * rendered by the parent, matching mobile's architecture where
 * Price.advanced.tsx composes IntervalBar + AdvancedChart + IndicatorBar.
 */

const CHART_ORIGIN = 'http://localhost:8001';

// If the chart hasn't emitted CHART_READY within this window, fall back to legacy.
const LOAD_TIMEOUT_MS = 10_000;

/** Imperative handle so the parent can send messages to the chart engine. */
export type AdvancedChartIframeRef = {
  postMessage: (message: Record<string, unknown>) => void;
};

type AdvancedChartIframeProps = {
  assetId: string;
  height?: number;
  chartType: number;
  selectedInterval: string;
  onError?: (error: string) => void;
  onReady?: () => void;
  /** Real-time candle update from useOHLCVRealtime hook */
  realtimeBar?: OHLCVRealtimeBar;
};

const AdvancedChartIframe = forwardRef<
  AdvancedChartIframeRef,
  AdvancedChartIframeProps
>(
  (
    {
      assetId,
      height = 300,
      chartType,
      selectedInterval,
      onError,
      onReady,
      realtimeBar,
    },
    ref,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [chartReady, setChartReady] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const theme = useTheme();
    const isDark = theme === 'dark';
    const chartUrl = `${CHART_ORIGIN}/index.html?theme=${isDark ? 'dark' : 'light'}`;

    // Reactive OHLCV data fetching via dedicated hook
    const { ohlcvData, error: ohlcvError } = useOHLCVChart({
      assetId,
      interval: selectedInterval,
    });

    const postToChart = useCallback((message: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify(message),
        CHART_ORIGIN,
      );
    }, []);

    // Expose postMessage to parent via ref
    useImperativeHandle(ref, () => ({ postMessage: postToChart }), [
      postToChart,
    ]);

    // Forward OHLCV errors to the parent
    useEffect(() => {
      if (ohlcvError) {
        onError?.(ohlcvError);
      }
    }, [ohlcvError, onError]);

    // Listen for messages from the chart engine
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== CHART_ORIGIN) {
          return;
        }
        try {
          const msg =
            typeof event.data === 'string'
              ? JSON.parse(event.data)
              : event.data;
          if (msg?.type === 'CHART_READY') {
            setChartReady(true);
            onReady?.();
          }
          if (msg?.type === 'ERROR' && msg?.payload?.message) {
            onError?.(msg.payload.message);
          }
        } catch {
          // ignore non-JSON
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onError, onReady]);

    // Fall back to legacy chart if chartReady isn't set within LOAD_TIMEOUT_MS.
    useEffect(() => {
      if (chartReady) {
        return;
      }
      const timer = setTimeout(() => {
        onError?.('Chart load timeout');
      }, LOAD_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }, [chartReady, onError]);

    // Send initial data on iframe load — just mark loaded; data flows via
    // the ohlcvData-gated useEffect below.
    const handleIframeLoad = useCallback(() => {
      setIframeLoaded(true);
    }, []);

    // Re-send chart type when it changes
    useEffect(() => {
      if (chartReady) {
        postToChart({ type: 'SET_CHART_TYPE', payload: { type: chartType } });
      }
    }, [chartType, chartReady, postToChart]);

    // Forward realtime bar updates to the chart engine
    useEffect(() => {
      if (!chartReady || !realtimeBar) {
        return;
      }
      console.log('[OHLCV-RT] Forwarding realtime bar to chart engine', {
        time: realtimeBar.time,
        close: realtimeBar.close,
      });
      postToChart({
        type: 'REALTIME_UPDATE',
        payload: { bar: realtimeBar },
      });
    }, [realtimeBar, chartReady, postToChart]);

    // Main data-sending path: post OHLCV data to iframe when it arrives and
    // the iframe is loaded. Gated on iframeLoaded (NOT chartReady) to match
    // mobile's pattern — the chart engine needs data BEFORE it can build the
    // widget and emit CHART_READY.
    useEffect(() => {
      if (iframeLoaded && ohlcvData.length > 0) {
        postToChart({ type: 'SET_OHLCV_DATA', payload: { data: ohlcvData } });
      }
    }, [iframeLoaded, ohlcvData, postToChart]);

    return (
      <div
        data-testid="advanced-chart-iframe"
        style={{
          width: '100%',
          height: `${height}px`,
          overflow: 'hidden',
          background: 'var(--color-background-default)',
        }}
      >
        <iframe
          ref={iframeRef}
          src={chartUrl}
          title="Advanced Chart"
          // Threat-model §Gap-1: sandbox the chart iframe so a compromised
          // remote page cannot navigate the top window or open popups.
          // allow-scripts: TradingView needs JS execution.
          // allow-same-origin: chart-origin scripts need same-origin access
          //   to their own localStorage / fetch. Deliberately omit
          //   allow-top-navigation and allow-popups.
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleIframeLoad}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    );
  },
);

AdvancedChartIframe.displayName = 'AdvancedChartIframe';
export default AdvancedChartIframe;
