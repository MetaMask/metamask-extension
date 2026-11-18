import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Skeleton } from '@metamask/design-system-react';
import { ENVIRONMENT } from '../../../../../shared/constants/build';
import { useTheme } from '../../../../hooks/useTheme';
import { isMovingAverage } from './advanced-chart-indicator-bar';
import { CHART_TYPE_CANDLE } from './advanced-chart-interval-bar';
import type { FetchOlderBarsResult, OHLCVBar } from './useOHLCVChart';
import type { OHLCVRealtimeBar } from './useOHLCVRealtime';

/**
 * Pure chart embed — the cross-origin iframe plus the postMessage bridge, and
 * nothing else. Mirrors mobile's AdvancedChart.tsx (the WebView component
 * only).
 *
 * All toolbar UI (IntervalBar, IndicatorBar) lives in separate components
 * rendered by the parent, matching mobile's architecture where
 * Price.advanced.tsx composes IntervalBar + AdvancedChart + IndicatorBar.
 */

export const CHART_ORIGIN_UAT = 'https://chart.uat.metamask-charts.com';
export const CHART_ORIGIN_PRD = 'https://chart.metamask-charts.com';

/**
 * Resolves the Advanced Charts iframe origin for the current MetaMask
 * environment. Production and release-candidate builds use the production
 * origin; every other environment (staging, dev, CI, PR, local) uses UAT.
 *
 * `CHART_ORIGIN_URL` (set via `.metamaskrc`/env) overrides the mapping so a
 * developer can point at a local chart-origin server (e.g.
 * `http://localhost:8001`).
 *
 * @returns The chart origin for the current build.
 */
export function getChartOrigin(): string {
  if (process.env.CHART_ORIGIN_URL) {
    return process.env.CHART_ORIGIN_URL;
  }

  switch (process.env.METAMASK_ENVIRONMENT) {
    case ENVIRONMENT.PRODUCTION:
    case ENVIRONMENT.RELEASE_CANDIDATE:
      return CHART_ORIGIN_PRD;
    case ENVIRONMENT.STAGING:
    case ENVIRONMENT.DEVELOPMENT:
    case ENVIRONMENT.TESTING:
    case ENVIRONMENT.PULL_REQUEST:
    case ENVIRONMENT.OTHER:
    default:
      return CHART_ORIGIN_UAT;
  }
}

export const CHART_ORIGIN = getChartOrigin();

// If the chart hasn't emitted CHART_READY within this window, fall back to legacy.
// Sized for a cold CDN cache fetching the ~20 MB TradingView library, not for
// the local chart-origin server.
export const LOAD_TIMEOUT_MS = 30_000;

const TRADINGVIEW_URL = 'https://www.tradingview.com';

/**
 * Narrows an engine-supplied URL to TradingView before we hand it to the
 * browser. The engine already filters, but it runs on a remote origin.
 *
 * @param raw - The url from the CHART_TRADINGVIEW_CLICKED payload, if any.
 * @returns A safe TradingView url.
 */
function toTradingViewUrl(raw?: unknown): string {
  if (typeof raw !== 'string' || raw === '') {
    return TRADINGVIEW_URL;
  }
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol === 'https:' &&
      (host === 'tradingview.com' || host.endsWith('.tradingview.com'))
    ) {
      return parsed.toString();
    }
  } catch {
    // Malformed url — fall through to the plain TradingView link.
  }
  return TRADINGVIEW_URL;
}

/** Imperative handle so the parent can send messages to the chart engine. */
export type AdvancedChartIframeRef = {
  postMessage: (message: Record<string, unknown>) => void;
};

type AdvancedChartIframeProps = {
  /**
   * Identifies the series currently plotted. Together with `selectedInterval`
   * it tells the component when the data below is a different series rather
   * than a newer version of the same one.
   */
  assetId: string;
  chartType: number;
  selectedInterval: string;
  /**
   * The currency the bars are priced in. Part of the series identity: a fiat
   * change re-prices every bar, which must rebuild the chart rather than tick.
   */
  currency?: string;
  /** Persisted indicator selection, re-applied to each freshly loaded chart. */
  activeIndicators?: Set<string>;
  /** OHLCV data from parent (includes merged realtime updates) */
  ohlcvData: OHLCVBar[];
  onError?: (error: string) => void;
  onReady?: () => void;
  /**
   * Fired for gesture interactions the chart engine reports: zoom, pan, and
   * tooltip. Already debounced by the engine, so there is no throttling here.
   */
  onChartInteracted?: (interactionType: 'zoom' | 'pan' | 'tooltip') => void;
  /**
   * Fired when a TradingView attribution link inside the chart is clicked. The
   * host already opens the (sanitised) URL; this is purely for analytics.
   */
  onTradingViewClicked?: () => void;
  /** Real-time candle update from useOHLCVRealtime hook */
  realtimeBar?: OHLCVRealtimeBar;
  /**
   * Fetches an older page of candles when the engine scrolls past the oldest
   * loaded bar. Host-backed ("RN-backed") pagination: the engine asks us for
   * older bars rather than fetching them itself, keeping all network egress in
   * the extension where there is no iframe-CSP restriction. Omit to disable.
   */
  fetchOlderBars?: () => Promise<FetchOlderBarsResult>;
};

const AdvancedChartIframe = forwardRef<
  AdvancedChartIframeRef,
  AdvancedChartIframeProps
>(
  (
    {
      assetId,
      chartType,
      selectedInterval,
      currency,
      activeIndicators,
      ohlcvData,
      onError,
      onReady,
      onChartInteracted,
      onTradingViewClicked,
      realtimeBar,
      fetchOlderBars,
    },
    ref,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [chartReady, setChartReady] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    // Which studies the engine currently has applied, so each sync posts only
    // a diff. Cleared on CHART_READY, since a (re)built chart starts bare.
    const appliedStudiesRef = useRef<Set<string>>(new Set());
    // The bars the engine was last given, so a newer arrival can be sent as a
    // cheap REALTIME_UPDATE instead of a full rebuild.
    const prevOhlcvDataRef = useRef<OHLCVBar[]>([]);
    // The message listener is attached once, but the pagination callback is a
    // prop that can change, so read it from a ref kept current each render.
    const fetchOlderBarsRef = useRef(fetchOlderBars);
    fetchOlderBarsRef.current = fetchOlderBars;
    const theme = useTheme();
    const isDark = theme === 'dark';
    const chartUrl = `${CHART_ORIGIN}/index.html?theme=${isDark ? 'dark' : 'light'}`;

    // The theme is baked into the iframe src, so switching it reloads the
    // engine and the replacement comes up bare. Reset the bookkeeping that
    // describes the old instance, otherwise we keep believing its indicators
    // and data are still applied and never re-send them.
    useEffect(() => {
      setChartReady(false);
      setIframeLoaded(false);
      appliedStudiesRef.current = new Set();
      prevOhlcvDataRef.current = [];
    }, [chartUrl]);

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
            appliedStudiesRef.current = new Set();
            setChartReady(true);
            onReady?.();
          }
          if (msg?.type === 'ERROR' && msg?.payload?.message) {
            onError?.(msg.payload.message);
          }
          // Zoom, pan, and tooltip gestures. The chart bundle debounces these
          // and sends tooltip once per crosshair session, so they arrive
          // pre-throttled and are forwarded straight up.
          if (
            msg?.type === 'CHART_INTERACTED' &&
            msg?.payload?.interaction_type
          ) {
            onChartInteracted?.(msg.payload.interaction_type);
          }
          // The TradingView attribution link must stay reachable (license
          // clause 3.2), but the iframe is sandboxed without allow-popups or
          // allow-top-navigation. The engine cancels the click and hands us
          // the url so the host opens it instead.
          if (msg?.type === 'CHART_TRADINGVIEW_CLICKED') {
            global.platform.openTab({
              url: toTradingViewUrl(msg?.payload?.url),
            });
            onTradingViewClicked?.();
          }
          // Host-backed pagination: the engine scrolled past its oldest loaded
          // bar and is asking us for an older page. Fetch it and reply with the
          // same requestId/seriesGeneration so the engine can match the
          // response and reject it if the series has since changed.
          if (msg?.type === 'FETCH_OLDER_BARS_REQUEST') {
            const { requestId, seriesGeneration } = msg.payload ?? {};
            const respond = (
              bars: OHLCVBar[],
              noData: boolean,
              error?: string,
            ) => {
              postToChart({
                type: 'FETCH_OLDER_BARS_RESPONSE',
                payload: {
                  requestId,
                  seriesGeneration,
                  bars,
                  noData,
                  ...(error ? { error } : {}),
                },
              });
            };
            const fetchOlder = fetchOlderBarsRef.current;
            if (fetchOlder) {
              // eslint-disable-next-line no-void -- fire-and-forget reply
              void fetchOlder()
                .then(({ bars, noData }) => respond(bars, noData))
                .catch((e) =>
                  respond(
                    [],
                    true,
                    e instanceof Error ? e.message : 'pagination error',
                  ),
                );
            } else {
              respond([], true);
            }
          }
        } catch {
          // ignore non-JSON
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [
      onChartInteracted,
      onError,
      onReady,
      onTradingViewClicked,
      postToChart,
    ]);

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

    // Studies are candlestick-only: the selection stays in preferences but
    // nothing is drawn on a line chart. Gating here rather than in the parent
    // means no caller can accidentally draw studies on a line chart.
    const showIndicators = chartType === CHART_TYPE_CANDLE;

    // Volume and moving averages have their own messages, so they're split out
    // of the generic add/remove list.
    const studies = useMemo(
      () =>
        showIndicators
          ? [...(activeIndicators ?? [])].filter(
              (name) => name !== 'Volume' && !isMovingAverage(name),
            )
          : [],
      [showIndicators, activeIndicators],
    );

    const movingAverages = useMemo(
      () =>
        showIndicators
          ? [...(activeIndicators ?? [])].filter(isMovingAverage)
          : [],
      [showIndicators, activeIndicators],
    );

    const showVolume =
      showIndicators && (activeIndicators?.has('Volume') ?? false);

    // Sync studies. Also re-applies the full selection to a newly loaded chart
    // (after navigating to another token, or reopening the extension), where
    // the engine has none applied yet.
    useEffect(() => {
      if (!chartReady) {
        return;
      }
      const applied = appliedStudiesRef.current;
      const desired = new Set(studies);

      for (const name of desired) {
        if (!applied.has(name)) {
          applied.add(name);
          postToChart({ type: 'ADD_INDICATOR', payload: { name } });
        }
      }
      for (const name of applied) {
        if (!desired.has(name)) {
          applied.delete(name);
          postToChart({ type: 'REMOVE_INDICATOR', payload: { name } });
        }
      }
    }, [studies, chartReady, postToChart]);

    // Moving averages are driven as a single batch rather than per-indicator.
    useEffect(() => {
      if (!chartReady) {
        return;
      }
      postToChart({
        type: 'SET_MA_VISIBILITY',
        payload: { visible: movingAverages },
      });
    }, [movingAverages, chartReady, postToChart]);

    useEffect(() => {
      if (!chartReady) {
        return;
      }
      postToChart({
        type: 'TOGGLE_VOLUME',
        payload: { visible: showVolume, volumeOverlay: true },
      });
    }, [showVolume, chartReady, postToChart]);

    // Forward realtime bar updates to the chart engine
    useEffect(() => {
      if (!chartReady || !realtimeBar) {
        return;
      }
      postToChart({
        type: 'REALTIME_UPDATE',
        payload: { bar: realtimeBar },
      });
    }, [realtimeBar, chartReady, postToChart]);

    // Identifies which series `ohlcvData` belongs to. Bar counts alone cannot
    // distinguish "one more candle on the same series" from "a different token
    // that happens to return the same number of candles". Currency is part of
    // the identity because a fiat change re-prices every bar.
    const seriesKey = `${assetId}|${selectedInterval}|${currency ?? ''}`;
    const seriesKeyRef = useRef(seriesKey);

    // Smart diffing: avoid full SET_OHLCV_DATA on every WS tick so the chart
    // engine can show a smooth real-time pulse via REALTIME_UPDATE instead of
    // a full resetData() rebuild. Matches mobile's AdvancedChart.tsx pattern.
    useEffect(() => {
      if (!iframeLoaded) {
        return;
      }

      // A different token or interval is never an incremental update, however
      // similar the two bar sets look.
      const seriesChanged = seriesKeyRef.current !== seriesKey;
      const hadData = prevOhlcvDataRef.current.length > 0;
      if (seriesChanged) {
        seriesKeyRef.current = seriesKey;
        prevOhlcvDataRef.current = [];
      }

      // A successful fetch that returns no candles is not an error, so nothing
      // else clears the chart. Without this, the previous asset's/interval's
      // candles stay stamped under the new series key. Only post the clear when
      // the engine could actually be holding stale bars.
      if (!ohlcvData?.length) {
        if (seriesChanged || hadData) {
          postToChart({ type: 'SET_OHLCV_DATA', payload: { data: [] } });
          prevOhlcvDataRef.current = [];
        }
        return;
      }

      const prevData = prevOhlcvDataRef.current;

      // `useOHLCVChart` keeps the previous series' bars until the next fetch
      // lands, so when a token/interval/currency switch returns a similar bar
      // count the `seriesKey` reset alone cannot be trusted — the stale bars
      // can be stamped under the new key for one render. The leading bar is
      // the reliable tell: its time and price only stay identical within one
      // continuous series, so a change there means a wholesale replacement.
      const first = ohlcvData[0];
      const prevFirst = prevData[0];
      const sameSeries =
        prevData.length > 0 &&
        Boolean(first) &&
        Boolean(prevFirst) &&
        first.time === prevFirst.time &&
        first.open === prevFirst.open &&
        first.high === prevFirst.high &&
        first.low === prevFirst.low &&
        first.close === prevFirst.close;

      // First load, a different series, or a bulk change (interval change,
      // pagination) → full SET_OHLCV_DATA.
      if (!sameSeries || Math.abs(ohlcvData.length - prevData.length) > 1) {
        postToChart({
          type: 'SET_OHLCV_DATA',
          // Strategy B (host-backed): the engine asks us for older bars via
          // FETCH_OLDER_BARS_REQUEST instead of fetching them itself. Must NOT
          // set `pagination` — that would switch on the in-iframe fetch path,
          // which the chart origin's strict CSP (connect-src 'none') blocks.
          payload: { data: ohlcvData, rnBackedPagination: { enabled: true } },
        });
        prevOhlcvDataRef.current = ohlcvData;
        return;
      }

      // If only the last candle changed → lightweight REALTIME_UPDATE
      // (matches mobile's AdvancedChart.tsx diffing logic)
      const last = ohlcvData[ohlcvData.length - 1];
      const prevLast = prevData[prevData.length - 1];
      if (
        last &&
        prevLast &&
        (last.time !== prevLast.time ||
          last.close !== prevLast.close ||
          last.high !== prevLast.high ||
          last.low !== prevLast.low ||
          last.volume !== prevLast.volume)
      ) {
        postToChart({ type: 'REALTIME_UPDATE', payload: { bar: last } });
        prevOhlcvDataRef.current = ohlcvData;
        return;
      }

      prevOhlcvDataRef.current = ohlcvData;
    }, [iframeLoaded, ohlcvData, seriesKey, postToChart]);

    return (
      <div
        data-testid="advanced-chart-iframe"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--color-background-default)',
        }}
      >
        {/* Covers the iframe until the engine reports ready, so a failing
            chart origin shows a skeleton rather than the browser's own
            "refused to connect" page. */}
        {!chartReady && (
          <div
            data-testid="advanced-chart-loading"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: 'var(--color-background-default)',
            }}
          >
            <Skeleton
              style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
            />
          </div>
        )}
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
