import { useCallback, useEffect, useRef, useState } from 'react';
import type { Json } from '@metamask/utils';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../../../../store/background-connection';
import { priceApiBaseUrl } from '../../../../../shared/constants/price-api';
import { getOhlcvTimePeriod } from './chart-window-mapping';
import { type OHLCVApiCandle, type OHLCVBar, toOHLCVBar } from './ohlcv-types';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OHLCVRealtimeBar = OHLCVBar;

export type UseOHLCVRealtimeOptions = {
  /** CAIP-19 or similar asset identifier. The hook stays idle while undefined. */
  assetId?: string;
  /** Candle interval (e.g. "1m", "5m", "1h", "1d") */
  interval: string;
  /** Fiat currency code (default "usd") */
  currency?: string;
  /** When false, skips subscription */
  enabled: boolean;
};

export type UseOHLCVRealtimeResult = {
  /** Latest bar from WebSocket stream or HTTP fallback (timestamp in milliseconds) */
  latestBar: OHLCVRealtimeBar | null;
};

// ─── Constants ──────────────────────────────────────────────────────────────

/** Debounce before subscribing to avoid thrashing during rapid navigation. */
const DEBOUNCE_MS = 500;

/** How often we check staleness and poll /latest when stale. */
const STALENESS_CHECK_INTERVAL_MS = 5_000;

/** If no WS message arrives within this window, consider the stream stale. */
const STALENESS_THRESHOLD_MS = 5_000;

/** REST endpoint for fetching the latest single candle. */
const OHLCV_LATEST_URL = `${priceApiBaseUrl}/v3/ohlcv`;

/**
 * Field-by-field equality check to avoid re-rendering on identical bars.
 * @param a
 * @param b
 */
function areBarsEqual(
  a: OHLCVRealtimeBar | null,
  b: OHLCVRealtimeBar | null,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.time === b.time &&
    a.open === b.open &&
    a.high === b.high &&
    a.low === b.low &&
    a.close === b.close &&
    a.volume === b.volume
  );
}

// ─── Helper functions ───────────────────────────────────────────────────────

/**
 * Unwraps a messenger event payload. MessengerSubscriptions wraps the event
 * args in an array, e.g. publish('OHLCVService:barUpdated', {channel, bar})
 * arrives as [{channel, bar}].
 *
 * @param data - The raw event data.
 * @returns The first event argument.
 */
function unwrapEventPayload<Payload>(data: Json): Payload {
  return (Array.isArray(data) ? data[0] : data) as unknown as Payload;
}

/**
 * Fetch the latest (current) candle from the /latest REST endpoint.
 * The API returns a single bar object with `timestamp` in milliseconds.
 *
 * @param assetId - CAIP or similar asset identifier
 * @param timePeriod - Time period for the API request
 * @param interval - Candle interval
 * @param currency - Fiat quote currency
 * @param signal - Optional AbortSignal for cancellation
 * @returns The latest bar or null if unavailable
 */
async function fetchLatestBar(
  assetId: string,
  timePeriod: string,
  interval: string,
  currency: string,
  signal?: AbortSignal,
): Promise<OHLCVRealtimeBar | null> {
  const url = new URL(`${OHLCV_LATEST_URL}/${assetId}/latest`);
  url.searchParams.set('timePeriod', timePeriod);
  url.searchParams.set('interval', interval);
  url.searchParams.set('vsCurrency', currency);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    return null;
  }

  const bar = (await response.json()) as OHLCVApiCandle | null;
  if (!bar) {
    return null;
  }

  // Validate numeric data
  if (
    typeof bar.timestamp !== 'number' ||
    typeof bar.close !== 'number' ||
    Number.isNaN(bar.timestamp) ||
    Number.isNaN(bar.close)
  ) {
    return null;
  }

  // Keep timestamp in milliseconds (matching useOHLCVChart format)
  return toOHLCVBar(bar);
}

/**
 * Extract the chain portion from a CAIP-19 asset ID.
 * e.g. "eip155:8453/erc20:0x..." → "eip155:8453"
 *
 * @param assetId - The CAIP-19 asset ID
 * @returns The chain portion of the asset ID
 */
function extractChainId(assetId: string): string {
  const slashIdx = assetId.indexOf('/');
  return slashIdx > 0 ? assetId.slice(0, slashIdx) : assetId;
}

// ─── React hook ─────────────────────────────────────────────────────────────

/**
 * Subscribes to real-time OHLCV candle updates via OHLCVService (WebSocket)
 * with REST `/latest` staleness fallback.
 *
 * Architecture: calls the background OHLCVService via the extension's
 * messenger bridge (`messengerCall` for actions, `subscribeToMessengerEvent`
 * for event subscriptions).
 *
 * Uses a 500ms debounce before subscribing to avoid thrashing during rapid
 * asset or interval changes.
 *
 * Includes a staleness-based HTTP polling fallback:
 * - Tracks `lastMessageTime` on every WS bar received.
 * - Every 5 seconds checks if no WS message arrived within the last 5 seconds.
 * - On subscribe error or chain-down, immediately polls `/latest` (no wait).
 * - When stale, continues polling `/latest` every 5s (matching WS heartbeat).
 *
 * @param options - Hook configuration options
 * @param options.assetId - CAIP-19 or similar asset identifier
 * @param options.interval - Candle interval (e.g. "1m", "5m", "1h", "1d")
 * @param options.currency - Fiat currency code (default "usd")
 * @param options.enabled - When false, skips subscription
 * @returns Object containing the latest bar data
 */
export function useOHLCVRealtime({
  assetId,
  interval,
  currency = 'usd',
  enabled,
}: UseOHLCVRealtimeOptions): UseOHLCVRealtimeResult {
  const [latestBar, setLatestBar] = useState<OHLCVRealtimeBar | null>(null);

  // Skip state update (and re-render) when the bar hasn't changed.
  // Matches mobile's areBarsEqual pattern to avoid unnecessary re-renders
  // of the entire AssetPage tree on every WS message.
  const updateLatestBar = useCallback((bar: OHLCVRealtimeBar) => {
    setLatestBar((prev) => (areBarsEqual(prev, bar) ? prev : bar));
  }, []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Staleness tracking
  const lastMessageTimeRef = useRef<number>(0);
  const stalenessTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainDownRef = useRef(false);
  const pollingAbortRef = useRef<AbortController | null>(null);

  // Track the subscription key to reset state on dependency changes
  const subscriptionKeyRef = useRef('');

  // The backend publishes OHLCV bars on the `ohlcv.v1.` namespace, e.g.
  // `ohlcv.v1.eip155:1/slip44:60.1h.eur`. This must match that prefix exactly;
  // previously it used `market-data.v1.`, so incoming bars never matched, WS
  // updates were ignored, and the staleness fallback polled `/latest` forever.
  const buildChannel = useCallback(
    () => `ohlcv.v1.${assetId}.${interval}.${currency}`,
    [assetId, interval, currency],
  );

  // Reset latestBar when inputs change (separate effect to avoid lint warning)
  useEffect(() => {
    const newKey = `${assetId}-${interval}-${currency}`;
    if (subscriptionKeyRef.current && subscriptionKeyRef.current !== newKey) {
      setLatestBar(null);
    }
    subscriptionKeyRef.current = newKey;
  }, [assetId, interval, currency]);

  useEffect(() => {
    if (!enabled || !assetId || !interval) {
      return undefined;
    }

    const channel = buildChannel();
    // Per-run flag: a shared ref would be reset by the next run, letting late
    // async work from a previous interval emit bars after a switch.
    let cancelled = false;
    lastMessageTimeRef.current = 0;
    chainDownRef.current = false;

    const timePeriod = getOhlcvTimePeriod(interval);

    // Staleness polling: check periodically if we should fall back to REST
    const pollLatest = async () => {
      pollingAbortRef.current?.abort();
      const controller = new AbortController();
      pollingAbortRef.current = controller;

      try {
        const bar = await fetchLatestBar(
          assetId,
          timePeriod,
          interval,
          currency,
          controller.signal,
        );
        if (bar && !controller.signal.aborted && !cancelled) {
          lastMessageTimeRef.current = Date.now();
          updateLatestBar(bar);
        }
      } catch {
        // Silently ignore errors (including AbortError)
      }
    };

    const unsubscribes: (() => Promise<void>)[] = [];

    const handleBarUpdated = (data: Json) => {
      const payload = unwrapEventPayload<{
        channel: string;
        bar: OHLCVApiCandle;
      }>(data);

      if (!cancelled && payload.channel === channel) {
        lastMessageTimeRef.current = Date.now();
        chainDownRef.current = false;
        // Convert WS bar (timestamp in seconds) to extension format (milliseconds)
        updateLatestBar(toOHLCVBar(payload.bar, 1000));
      }
    };

    const handleSubscriptionError = (data: Json) => {
      const payload = unwrapEventPayload<{
        channel: string;
        error: string;
        operation: string;
      }>(data);

      if (payload.operation === 'subscribe' && payload.channel === channel) {
        // Mark as stale so staleness check triggers REST polling immediately
        lastMessageTimeRef.current = 1;
        // eslint-disable-next-line no-void -- fire-and-forget async poll
        void pollLatest();
      }
    };

    const chainId = extractChainId(assetId);
    const handleChainStatusChanged = (data: Json) => {
      const payload = unwrapEventPayload<{
        chainIds: string[];
        status: 'up' | 'down';
        timestamp?: number;
      }>(data);

      if (payload.chainIds.includes(chainId)) {
        chainDownRef.current = payload.status === 'down';
        if (payload.status === 'down') {
          // eslint-disable-next-line no-void -- fire-and-forget async poll
          void pollLatest();
        }
      }
    };

    // Subscribe to messenger events before triggering the WS subscription
    const subscribeToEvents = async () => {
      const unsubBarUpdated = await subscribeToMessengerEvent(
        'OHLCVService:barUpdated',
        handleBarUpdated,
      );
      if (cancelled) {
        await unsubBarUpdated();
        return;
      }
      unsubscribes.push(unsubBarUpdated);

      const unsubError = await subscribeToMessengerEvent(
        'OHLCVService:subscriptionError',
        handleSubscriptionError,
      );
      if (cancelled) {
        await unsubError();
        return;
      }
      unsubscribes.push(unsubError);

      const unsubChainStatus = await subscribeToMessengerEvent(
        'OHLCVService:chainStatusChanged',
        handleChainStatusChanged,
      );
      if (cancelled) {
        await unsubChainStatus();
        return;
      }
      unsubscribes.push(unsubChainStatus);
    };

    // Start event subscriptions immediately (before debounced WS subscribe)
    subscribeToEvents().catch(() => {
      // Non-fatal: event subscription failure handled by staleness fallback.
    });

    // Staleness check: poll REST when WS is stale or chain is down
    stalenessTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastMessageTimeRef.current;
      const isStale =
        lastMessageTimeRef.current > 0 && elapsed >= STALENESS_THRESHOLD_MS;

      if (isStale || chainDownRef.current) {
        // eslint-disable-next-line no-void -- fire-and-forget async poll
        void pollLatest();
      }
    }, STALENESS_CHECK_INTERVAL_MS);

    // Debounce the actual WS subscribe call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await submitRequestToBackground('messengerCall', [
          'OHLCVService:subscribe',
          [{ assetId, interval, currency }],
        ]);
        // Cleanup already sent the matching unsubscribe.
        if (cancelled) {
          return;
        }

        lastMessageTimeRef.current = Date.now();

        // Immediate REST poll for instant data while waiting for first WS bar
        // eslint-disable-next-line no-void -- fire-and-forget async poll
        void pollLatest();
      } catch {
        // Subscribe failure handled via subscriptionError event → immediate REST poll.
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (stalenessTimerRef.current) {
        clearInterval(stalenessTimerRef.current);
        stalenessTimerRef.current = null;
      }

      pollingAbortRef.current?.abort();

      // Unsubscribe from messenger events
      for (const unsub of unsubscribes) {
        unsub().catch(() => {
          // Non-fatal cleanup
        });
      }

      // Unsubscribe from WS channel in background
      submitRequestToBackground('messengerCall', [
        'OHLCVService:unsubscribe',
        [{ assetId, interval, currency }],
      ]).catch(() => {
        // Non-fatal: grace period in core will handle cleanup.
      });
    };
  }, [assetId, interval, currency, enabled, buildChannel, updateLatestBar]);

  return { latestBar };
}
