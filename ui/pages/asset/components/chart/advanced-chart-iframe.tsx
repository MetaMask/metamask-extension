import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Skeleton } from '@metamask/design-system-react';
import { ENVIRONMENT } from '../../../../../shared/constants/build';
import { useTheme } from '../../../../hooks/useTheme';
import { isMovingAverage } from './advanced-chart-indicator-bar';
import { CHART_TYPE_CANDLE } from './advanced-chart-interval-bar';
import {
  getTvResolution,
  VISIBLE_WINDOW_MS_BY_INTERVAL,
} from './chart-window-mapping';
import type { FetchOlderBarsResult, OHLCVBar } from './useOHLCVChart';
import type { OHLCVRealtimeBar } from './useOHLCVRealtime';

/**
 * Pure chart embed: one persistent iframe plus its postMessage bridge. Toolbar
 * UI (IntervalBar, IndicatorBar) is rendered by the parent, as on mobile.
 *
 * Interval switches happen in place (no remount), e.g. 1W → 1m keeps the
 * widget, studies and MAs and only re-sends the new bars. This avoids the
 * ASSETS-4400 storm, where a 1W → 1m switch asked for ~500k bars.
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
   * `countBack` = bars the engine still needs, e.g. 300 → walk pages until
   * ≥300, then reply once.
   */
  fetchOlderBars?: (countBack?: number) => Promise<FetchOlderBarsResult>;
  /** Resets the host pagination cursor; called on every full `SET_OHLCV_DATA`. */
  resetPagination?: () => void;
};

const AdvancedChartIframe = ({
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
  resetPagination,
}: AdvancedChartIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  // Set on the first CHART_READY (interval switches never re-emit it). Gates
  // the study/MA/volume/chart-type sync effects and the one-time skeleton.
  const [chartReady, setChartReady] = useState(false);
  // Which studies the engine currently has applied, so each sync posts only
  // a diff. Cleared on CHART_READY (the first, bare build).
  const appliedStudiesRef = useRef<Set<string>>(new Set());
  // The bars the engine was last given, so a newer arrival can be sent as a
  // cheap REALTIME_UPDATE instead of a full rebuild.
  const prevOhlcvDataRef = useRef<OHLCVBar[]>([]);
  // Newest bar time the engine holds (REST or live tick). Merges never post
  // older bars: the engine only appends/replaces at the tail.
  const engineLastTimeRef = useRef<number | null>(null);
  // The message listener is attached once, but the pagination callback is a
  // prop that can change, so read it from a ref kept current each render.
  const fetchOlderBarsRef = useRef(fetchOlderBars);
  useEffect(() => {
    fetchOlderBarsRef.current = fetchOlderBars;
  }, [fetchOlderBars]);
  const theme = useTheme();
  const isDark = theme === 'dark';
  const chartUrl = `${CHART_ORIGIN}/index.html?theme=${isDark ? 'dark' : 'light'}`;

  // Theme is in the iframe src, so a theme change (e.g. dark → light) reloads a
  // bare engine: forget what the old one had applied. State resets run during
  // render (avoids setState-in-effect); ref resets run in an effect because
  // refs can't be written during render.
  const [prevChartUrl, setPrevChartUrl] = useState(chartUrl);
  if (prevChartUrl !== chartUrl) {
    setPrevChartUrl(chartUrl);
    setChartReady(false);
    setIframeLoaded(false);
  }
  useEffect(() => {
    appliedStudiesRef.current = new Set();
    prevOhlcvDataRef.current = [];
    engineLastTimeRef.current = null;
  }, [chartUrl]);

  const postToChart = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify(message),
      CHART_ORIGIN,
    );
  }, []);

  // Listen for messages from the chart engine
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== CHART_ORIGIN) {
        return;
      }
      try {
        const msg =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg?.type === 'CHART_READY') {
          // Every (re)build starts bare, so forget what the previous series had
          // applied and latch ready to run the sync effects.
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
          const { requestId, seriesGeneration, countBack } = msg.payload ?? {};
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
            void fetchOlder(countBack)
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
  }, [onChartInteracted, onError, onReady, onTradingViewClicked, postToChart]);

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

  // The engine only ever draws candles; line mode uses the legacy chart while
  // the engine stays hidden. Sending SET_CHART_TYPE(line) would rebuild the
  // hidden series and leave the time axis blank on toggle back, so the engine
  // is pinned to candle. The line/candle preference is still persisted upstream.
  useEffect(() => {
    if (chartReady) {
      postToChart({
        type: 'SET_CHART_TYPE',
        payload: { type: CHART_TYPE_CANDLE },
      });
    }
    // Sets the chart type once the first (bare candle) build is ready.
  }, [chartReady, postToChart]);

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
    // Applies the full study selection once the first build is ready (it
    // starts bare, with `appliedStudiesRef` cleared).
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
    if (
      engineLastTimeRef.current === null ||
      realtimeBar.time >= engineLastTimeRef.current
    ) {
      engineLastTimeRef.current = realtimeBar.time;
    }
  }, [realtimeBar, chartReady, postToChart]);

  // Identifies which series `ohlcvData` belongs to. Bar counts alone cannot
  // distinguish "one more candle on the same series" from "a different token
  // that happens to return the same number of candles". Currency is part of
  // the identity because a fiat change re-prices every bar.
  const seriesKey = `${assetId}|${selectedInterval}|${currency ?? ''}`;
  const seriesKeyRef = useRef(seriesKey);

  // Smart diffing: same-series refetches are merged as REALTIME_UPDATEs so the
  // user's scroll and older pages survive; anything else is a full reload.
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
        resetPagination?.();
        postToChart({ type: 'SET_OHLCV_DATA', payload: { data: [] } });
        prevOhlcvDataRef.current = [];
        engineLastTimeRef.current = null;
      }
      return;
    }

    const prevData = prevOhlcvDataRef.current;

    // Same array as last time (effect re-ran for an unrelated dep): no-op.
    if (!seriesChanged && ohlcvData === prevData) {
      return;
    }

    // Merge if same series and the refetch overlaps the engine. E.g. engine
    // newest = 10:00, refetch = 08:00–10:05 → post only 10:00 and 10:05.
    // New series, empty engine, or a gap (refetch starts 10:10) → full reload.
    const engineLast = engineLastTimeRef.current;
    const canMerge =
      !seriesChanged && engineLast !== null && ohlcvData[0].time <= engineLast;

    if (canMerge) {
      for (const bar of ohlcvData) {
        if (bar.time >= engineLast) {
          postToChart({ type: 'REALTIME_UPDATE', payload: { bar } });
        }
      }
      engineLastTimeRef.current = Math.max(
        engineLast,
        ohlcvData[ohlcvData.length - 1].time,
      );
      prevOhlcvDataRef.current = ohlcvData;
      return;
    }

    // Anchor the initial visible window to the latest loaded bar so the
    // engine frames a recent span instead of auto-fitting all history
    // (which makes candle mode reach much further back than the line).
    const lastBarTime = ohlcvData[ohlcvData.length - 1]?.time;
    const windowMs = VISIBLE_WINDOW_MS_BY_INTERVAL[selectedInterval];
    const visibleFromMs =
      lastBarTime !== undefined && windowMs !== undefined
        ? lastBarTime - windowMs
        : undefined;
    // Explicit resolution: the engine otherwise infers it from bar spacing,
    // which misfires on low-liquidity tokens (e.g. 5m detected as 30m).
    const resolution = getTvResolution(selectedInterval);

    // Engine history is replaced by page 1, so pagination restarts from it.
    resetPagination?.();

    postToChart({
      type: 'SET_OHLCV_DATA',
      // Strategy B (host-backed): the engine asks us for older bars via
      // FETCH_OLDER_BARS_REQUEST instead of fetching them itself. Must NOT
      // set `pagination` — that would switch on the in-iframe fetch path,
      // which the chart origin's strict CSP (connect-src 'none') blocks.
      payload: {
        data: ohlcvData,
        rnBackedPagination: { enabled: true },
        // Opt into the core bounded interval window: each interval's visible
        // window is applied after load (never inherited from a previous
        // interval) and clamped to the loaded bars, so interval switches
        // don't trigger a backward pagination storm.
        boundedIntervalWindow: true,
        ...(visibleFromMs === undefined ? {} : { visibleFromMs }),
        // Older core versions ignore this field.
        ...(resolution === undefined ? {} : { resolution }),
      },
    });
    prevOhlcvDataRef.current = ohlcvData;
    engineLastTimeRef.current = lastBarTime ?? null;
  }, [
    iframeLoaded,
    ohlcvData,
    seriesKey,
    selectedInterval,
    postToChart,
    resetPagination,
  ]);

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
      {/* The skeleton shows only until the first CHART_READY. Interval switches
            are handled in place on the persistent widget, so they never blank
            to this skeleton. It also covers a failing chart origin so a load error
            shows a skeleton rather than the browser's "refused to connect"
            page. */}
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
};

export default AdvancedChartIframe;
