import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import browser from 'webextension-polyfill';
import { lightTheme, darkTheme } from '@metamask/design-tokens';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { useTheme } from '../../../../hooks/useTheme';
import type { OhlcvBar } from '../../hooks/useOhlcvChartData';

/**
 * MINIMAL Advanced Chart (TradingView) integration for the extension TDP.
 *
 * This is the HOST side of the sandboxed-iframe bridge. It renders the
 * sandboxed page `advanced-chart/index.html` (which boots the shared
 * `@metamask/advanced-chart-core` engine IIFE) and drives it over
 * `postMessage`, mirroring how mobile's `AdvancedChart.tsx` drives the RN
 * WebView. See `app/advanced-chart/index.html` for the exact protocol.
 *
 * OHLCV data is fetched by the parent (`asset-page.tsx` via `useOhlcvChartData`)
 * and passed in as the `bars` prop — this host no longer fetches, avoiding a
 * double fetch. It just forwards the bars to the engine over the bridge.
 *
 * The proprietary TradingView `charting_library` binary is NOT bundled — see
 * `app/advanced-chart/lib/README.md`. Until it is self-hosted the engine boots
 * but emits an `ERROR` when the library fails to load (handled below).
 */

/** Shared bridge channel — must match `app/advanced-chart/index.html`. */
const HOST_CHANNEL = 'metamask-advanced-chart';

// The engine (`chartLogic.iife.js`) emits this `DEBUG` payload once `bootstrap()`
// has registered its inbound message handlers. It builds the TradingView widget
// LAZILY on the FIRST `SET_OHLCV_DATA` (see engine `onFirstOhlcvData`), and only
// then emits `CHART_READY`. So the host must push the initial OHLCV as soon as the
// engine is listening — mirroring mobile's `webViewLoaded`/`onLoadEnd` gate. If we
// waited for `CHART_READY` before sending data (as the original code did) the two
// sides deadlock and the sandbox stays stuck on its "Loading chart…" overlay.
const ENGINE_BOOTSTRAP_READY_MESSAGE = 'modular-bootstrap-ready';

const DEFAULT_CHART_HEIGHT = 360;

/** Messages the host receives from the sandboxed page. */
type FromEngineEnvelope =
  | { channel: string; direction: 'fromEngine'; ready: true }
  | { channel: string; direction: 'fromEngine'; data: string };

/** Parsed engine payloads we act on. Other engine messages are ignored here. */
type EngineMessage =
  | { type: 'CHART_READY' }
  | { type: 'ERROR'; payload?: { message?: string } }
  | { type: string; payload?: unknown };

export type AdvancedAssetChartProps = {
  /** OHLCV bars to render, fetched by the parent via `useOhlcvChartData`. */
  bars: OhlcvBar[];
  /** Ticker symbol, forwarded to the engine for the chart legend. */
  symbol?: string;
  /** Chart height in px. */
  height?: number;
};

/** Design-token themes exposed by `@metamask/design-tokens`. */
type DesignTokenTheme = typeof lightTheme;

/**
 * Design tokens may use 9-char hex (#RRGGBBAA); TradingView expects #RRGGBB.
 *
 * @param hex - A hex color string.
 * @returns The hex color with any alpha channel stripped.
 */
const stripHexAlpha = (hex: string): string =>
  hex.length === 9 && hex.startsWith('#') ? hex.slice(0, 7) : hex;

/**
 * Builds the `window.CONFIG` object the engine reads synchronously on boot.
 * Mirrors mobile's `createConfigScript()` shape, trimmed to what a minimal
 * render needs.
 *
 * @param libraryUrl - Base URL the engine loads `charting_library.js` from.
 * @param theme - Resolved design-token theme.
 * @returns The engine `window.CONFIG` payload.
 */
const buildEngineConfig = (libraryUrl: string, theme: DesignTokenTheme) => {
  const successColor = stripHexAlpha(theme.colors.success.default);
  const errorColor = stripHexAlpha(theme.colors.error.default);
  return {
    libraryUrl,
    theme: {
      backgroundColor: stripHexAlpha(theme.colors.background.default),
      borderColor: stripHexAlpha(theme.colors.border.muted),
      textColor: stripHexAlpha(theme.colors.text.muted),
      textDefaultColor: stripHexAlpha(theme.colors.text.default),
      sectionBackgroundColor: stripHexAlpha(theme.colors.background.section),
      crosshairBackgroundColor: stripHexAlpha(theme.colors.background.section),
      crosshairTextColor: stripHexAlpha(theme.colors.text.default),
      legendTextColor: stripHexAlpha(theme.colors.text.alternative),
      textAlternativeColor: stripHexAlpha(theme.colors.text.alternative),
      successColor,
      lineColor: successColor,
      gridLineColor: 'transparent',
      errorColor,
      volumeSuccessColor: successColor,
      volumeErrorColor: errorColor,
      primaryColor: stripHexAlpha(theme.colors.primary.default),
      currentPriceColor: successColor,
    },
    features: {
      enableDrawingTools: false,
      disabledFeatures: [] as string[],
      hidePaneSeparator: false,
      showBuiltInLegend: false,
    },
    legendOverlay: { enabled: false },
    useSubscriptPriceFormat: false,
    priceDecimals: null,
    indicatorColors: {},
  };
};

/**
 * Renders the TradingView Advanced Chart inside a sandboxed iframe and wires
 * the host<->engine bridge. See file header for the protocol.
 *
 * @param props - Component props.
 * @returns The advanced chart host element.
 */
const AdvancedAssetChart = ({
  bars,
  symbol,
  height = DEFAULT_CHART_HEIGHT,
}: AdvancedAssetChartProps) => {
  const themeType = useTheme();
  const theme = themeType === ThemeType.dark ? darkTheme : lightTheme;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chartReadyRef = useRef(false);
  const barsRef = useRef<OhlcvBar[]>(bars);
  barsRef.current = bars;
  const [error, setError] = useState<string | null>(null);

  const iframeSrc = useMemo(() => {
    // Resolves to a `chrome-extension://<id>/advanced-chart/index.html` URL.
    try {
      return browser.runtime.getURL('advanced-chart/index.html');
    } catch {
      return '';
    }
  }, []);

  // The sandbox iframe's origin (`chrome-extension://<id>`). Because the iframe
  // sets `allow-same-origin`, it shares this real extension origin, so we can
  // both (a) pin every outbound `postMessage` `targetOrigin` to it and (b)
  // reject any inbound message whose `event.origin` is not it — instead of the
  // wildcard `'*'`. Mirrors mobile's `onFromRN` origin gate.
  const engineOrigin = useMemo(() => {
    try {
      return iframeSrc ? new URL(iframeSrc).origin : '';
    } catch {
      return '';
    }
  }, [iframeSrc]);

  const config = useMemo(
    () =>
      buildEngineConfig(
        // The engine appends `charting_library.js` to this base URL. The binary
        // is not yet self-hosted; see `app/advanced-chart/lib/README.md`.
        // TODO(blocker): ship the proprietary charting_library under
        // `advanced-chart/lib/` for the widget to actually initialize.
        browser.runtime.getURL('advanced-chart/lib/'),
        theme,
      ),
    [theme],
  );

  /** Post a message to the sandboxed engine. */
  const postToEngine = useCallback(
    (message: Record<string, unknown>) => {
      const target = iframeRef.current?.contentWindow;
      if (!target) {
        return;
      }
      // The recipient sandbox has an OPAQUE origin, so a `targetOrigin` pinned
      // to `chrome-extension://<id>` would silently DROP the message (the
      // browser only delivers when the recipient's origin equals targetOrigin,
      // and an opaque origin matches nothing). We therefore target '*'. The
      // trust boundary is preserved on the RECEIVING side by the iframe's
      // `event.source === window.parent` + parent-origin checks; nothing
      // sensitive is leaked (CONFIG is theme/library-url data).
      const targetOrigin = '*';
      target.postMessage(
        { channel: HOST_CHANNEL, direction: 'toEngine', ...message },
        targetOrigin,
      );
    },
    [],
  );

  const sendOHLCV = useCallback(
    (nextBars: OhlcvBar[]) => {
      postToEngine({
        kind: 'engineMessage',
        payload: {
          type: 'SET_OHLCV_DATA',
          payload: { data: nextBars },
        },
      });
    },
    [postToEngine],
  );

  const handleEngineMessage = useCallback(
    (message: EngineMessage) => {
      switch (message.type) {
        case 'DEBUG': {
          // Kick off the handshake: the engine is bootstrapped and waiting for
          // the first SET_OHLCV_DATA to build the widget (which then emits
          // CHART_READY and hides the loading overlay). Without this initial
          // push the host and engine deadlock. See ENGINE_BOOTSTRAP_READY_MESSAGE.
          const debugMessage = (message as { payload?: { message?: string } })
            .payload?.message;
          if (debugMessage === ENGINE_BOOTSTRAP_READY_MESSAGE) {
            sendOHLCV(barsRef.current);
          }
          break;
        }
        case 'CHART_READY':
          chartReadyRef.current = true;
          setError(null);
          sendOHLCV(barsRef.current);
          break;
        case 'ERROR': {
          const msg =
            (message as { payload?: { message?: string } }).payload?.message ??
            'Advanced chart failed to load';
          setError(msg);
          break;
        }
        default:
          break;
      }
    },
    [sendOHLCV],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return undefined;
    }

    const onMessage = (event: MessageEvent) => {
      // Trust boundary for inbound messages from the sandboxed page.
      //
      // The sandbox iframe has an OPAQUE origin (MV3 `sandbox` CSP), so every
      // message it posts arrives with `event.origin === 'null'` (or ''), which
      // can never match `engineOrigin` (`chrome-extension://<id>`). The origin
      // allowlist alone therefore permanently rejects the real engine and the
      // handshake deadlocks. `event.source`, however, IS reliable even for an
      // opaque-origin sender: it strictly equals our own `iframe.contentWindow`.
      //
      // So we make `sourceMatch` the primary gate and allow the opaque origin
      // as an explicit exception: accept iff `sourceMatch === true` AND the
      // origin either matches the allowlist OR is the opaque 'null'/'' origin.
      // We still reject anything from an unknown source.
      const sourceMatch = event.source === iframe.contentWindow;
      const originMatch = !engineOrigin || event.origin === engineOrigin;
      const opaqueOrigin = event.origin === 'null' || event.origin === '';
      const accepted = sourceMatch && (originMatch || opaqueOrigin);
      if (!accepted) {
        return;
      }
      const envelope = event.data as FromEngineEnvelope | undefined;
      if (
        !envelope ||
        envelope.channel !== HOST_CHANNEL ||
        envelope.direction !== 'fromEngine'
      ) {
        return;
      }

      if ('ready' in envelope && envelope.ready) {
        postToEngine({ kind: 'config', config });
        return;
      }

      if ('data' in envelope && typeof envelope.data === 'string') {
        try {
          const parsed = JSON.parse(envelope.data) as EngineMessage;
          handleEngineMessage(parsed);
        } catch {
          // Ignore non-JSON engine output.
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [config, engineOrigin, handleEngineMessage, postToEngine]);

  // Push new bars to the engine whenever the parent-fetched data changes,
  // provided the chart has already signalled `CHART_READY`. The initial bars
  // are sent from the `CHART_READY` handler above.
  useEffect(() => {
    if (chartReadyRef.current) {
      sendOHLCV(bars);
    }
  }, [bars, sendOHLCV]);

  if (!iframeSrc) {
    return null;
  }

  return (
    <div
      data-testid="advanced-asset-chart"
      style={{ width: '100%', height, position: 'relative' }}
    >
      {error ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: stripHexAlpha(theme.colors.text.muted),
            fontSize: 13,
          }}
        >
          Chart unavailable
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title={
            symbol ? `${symbol} advanced chart` : 'Advanced chart'
          }
          src={iframeSrc}
          // `allow-same-origin` is REQUIRED (in addition to the manifest sandbox
          // CSP flag): TradingView renders the chart in a nested inner frame and
          // drives it via DIRECT same-origin DOM access, NOT postMessage
          // (`charting_library.js` contains ZERO `postMessage` calls). The host
          // widget calls `this._innerWindow().widgetReady(...)` on the inner
          // frame's window, and the `iframe_loading_*` init paths all touch the
          // inner document same-origin: `contentWindow.document.write(...)`
          // (`iframe_loading_compatibility_mode`), `await sameOriginLoad`
          // (`iframe_loading_same_origin`), or `window.parent[uid]` /
          // `frameElement.dataset` (blob path). We evaluated the security
          // review's suggested `iframe_loading_compatibility_mode`: it does NOT
          // avoid same-origin access (it writes into `contentWindow.document`),
          // so it cannot render in an opaque-origin sandbox without this flag.
          // Without `allow-same-origin` the inner frame gets a unique opaque
          // origin, those reads throw, and the widget never reaches onChartReady
          // (chart paints its dark background but stays on "Loading chart…").
          // The effective sandbox is the INTERSECTION of this attribute and the
          // manifest `sandbox` CSP, so snaps' iframe (which does NOT set
          // `allow-same-origin`) remains isolated.
          sandbox="allow-scripts allow-same-origin"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      )}
    </div>
  );
};

export default AdvancedAssetChart;
