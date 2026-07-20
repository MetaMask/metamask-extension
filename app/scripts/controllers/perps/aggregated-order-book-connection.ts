import { WebSocketTransport } from '@nktkas/hyperliquid';
import type { OrderBookData } from '@metamask/perps-controller';

/**
 * A single L2 book price level as delivered by Hyperliquid's `l2Book`
 * subscription. Declared locally to avoid coupling to the SDK's exported type
 * names (and to keep this the only file that references the SDK's shapes).
 */
type HyperliquidL2BookLevel = {
  /** Price. */
  px: string;
  /** Total size resting at this price. */
  sz: string;
  /** Number of individual orders. */
  n: number;
};

/** `l2Book` snapshot event (index 0 = bids, index 1 = asks). */
type HyperliquidL2BookEvent = {
  coin: string;
  time: number;
  levels: [bids: HyperliquidL2BookLevel[], asks: HyperliquidL2BookLevel[]];
  spread?: string;
};

/** Minimal shape of the SDK subscription handle we rely on. */
type Subscription = { unsubscribe: () => Promise<void> };

/**
 * Health of the dedicated order-book socket, surfaced to the UI so the panel
 * can show a reconnect affordance.
 * - `connecting`: socket opening or reconnecting after a transient drop.
 * - `connected`: subscription is live.
 * - `error`: dropped and automatic reconnection was exhausted; needs a manual reconnect.
 */
export type OrderBookConnectionStatus = 'connecting' | 'connected' | 'error';

export type SubscribeAggregatedOrderBookParams = {
  /** Market symbol (e.g. 'BTC'). */
  symbol: string;
  /** Number of levels per side to keep. */
  levels?: number;
  /** Server-side aggregation significant figures. */
  nSigFigs?: 2 | 3 | 4 | 5;
  /** Mantissa refinement when `nSigFigs` is 5. */
  mantissa?: 2 | 5;
  /** Invoked with each processed snapshot. */
  callback: (data: OrderBookData) => void;
  /** Invoked when the underlying socket's health changes. */
  onStatusChange?: (status: OrderBookConnectionStatus) => void;
};

export type AggregatedOrderBookConnectionOptions = {
  /** Resolves the current network at subscribe time. */
  isTestnet: () => boolean;
};

// Fast mode streams 5 levels per side (slow mode streams 20). We run fast mode
// for lower-latency ladder updates, so the book never carries more than this.
const DEFAULT_LEVELS = 5;

/**
 * Transforms a raw Hyperliquid `l2Book` snapshot into the `OrderBookData` shape
 * the UI consumes. Mirrors the controller's internal `processOrderBookData` so
 * this dedicated connection is a drop-in replacement for
 * `PerpsController.subscribeToOrderBook` on the aggregated channel.
 *
 * @param data - Raw `l2Book` event.
 * @param levels - Number of levels per side to keep.
 * @returns Processed order-book snapshot.
 */
export function processAggregatedOrderBook(
  data: HyperliquidL2BookEvent,
  levels: number,
): OrderBookData {
  const bidsRaw = data?.levels?.[0] ?? [];
  const asksRaw = data?.levels?.[1] ?? [];

  let bidCumulativeSize = 0;
  let bidCumulativeNotional = 0;
  const bids = bidsRaw.slice(0, levels).map((level) => {
    const price = Number.parseFloat(level.px);
    const size = Number.parseFloat(level.sz);
    const notional = price * size;
    bidCumulativeSize += size;
    bidCumulativeNotional += notional;
    return {
      price: level.px,
      size: level.sz,
      total: bidCumulativeSize.toString(),
      notional: notional.toFixed(2),
      totalNotional: bidCumulativeNotional.toFixed(2),
    };
  });

  let askCumulativeSize = 0;
  let askCumulativeNotional = 0;
  const asks = asksRaw.slice(0, levels).map((level) => {
    const price = Number.parseFloat(level.px);
    const size = Number.parseFloat(level.sz);
    const notional = price * size;
    askCumulativeSize += size;
    askCumulativeNotional += notional;
    return {
      price: level.px,
      size: level.sz,
      total: askCumulativeSize.toString(),
      notional: notional.toFixed(2),
      totalNotional: askCumulativeNotional.toFixed(2),
    };
  });

  const bestBid = bids[0];
  const bestAsk = asks[0];
  const bidPrice = bestBid ? Number.parseFloat(bestBid.price) : 0;
  const askPrice = bestAsk ? Number.parseFloat(bestAsk.price) : 0;
  const spread = askPrice > 0 && bidPrice > 0 ? askPrice - bidPrice : 0;
  const midPrice = askPrice > 0 && bidPrice > 0 ? (askPrice + bidPrice) / 2 : 0;
  const spreadPercentage =
    midPrice > 0 ? ((spread / midPrice) * 100).toFixed(4) : '0';
  const maxTotal = Math.max(bidCumulativeSize, askCumulativeSize).toString();

  return {
    bids,
    asks,
    spread: spread.toFixed(5),
    spreadPercentage,
    midPrice: midPrice.toFixed(5),
    lastUpdated: Date.now(),
    maxTotal,
  };
}

/**
 * Owns a dedicated Hyperliquid WebSocket connection used solely for the
 * order-book panel's server-aggregated `l2Book` subscription.
 *
 * The extension's main connection (managed by `PerpsController`) multiplexes
 * every subscription onto a single socket. The Hyperliquid SDK dispatches
 * `l2Book` events by `coin` only, so running the raw (full-precision) and the
 * aggregated (`nSigFigs`) subscriptions for the same coin on that shared socket
 * cross-contaminates them — the coarse ladder and the precise spread/slippage
 * clobber each other. Giving the aggregated subscription its own socket removes
 * the collision entirely: this socket only ever carries a single `l2Book`
 * stream, and the main socket is never touched by the panel's grouping.
 *
 * The socket is created lazily on the first subscription and torn down once the
 * last subscription is removed, so it exists only while an order-book panel is
 * open. Because network is a global setting, the transport is recreated if
 * `isTestnet` changes between (re)subscriptions.
 */
export class AggregatedOrderBookConnection {
  readonly #isTestnet: () => boolean;

  #transport: WebSocketTransport | null = null;

  #transportIsTestnet = false;

  #activeCount = 0;

  // Set when the socket's auto-reconnection is exhausted (SDK `terminate`
  // event). A terminated socket cannot recover, so the next subscribe must
  // build a fresh transport instead of reusing the dead one.
  #terminated = false;

  constructor({ isTestnet }: AggregatedOrderBookConnectionOptions) {
    this.#isTestnet = isTestnet;
  }

  /**
   * Opens an aggregated `l2Book` subscription on the dedicated socket.
   *
   * Mirrors the controller's synchronous-unsubscribe contract: the returned
   * function can be called before the async subscribe resolves and will cancel
   * the pending subscription.
   *
   * @param params - Subscription parameters.
   * @returns An unsubscribe function.
   */
  subscribe(params: SubscribeAggregatedOrderBookParams): () => void {
    const levels = params.levels ?? DEFAULT_LEVELS;
    const transport = this.#ensureTransport(this.#isTestnet());
    const { socket } = transport;

    let cancelled = false;
    let subscription: Subscription | null = null;
    this.#activeCount += 1;

    const reportStatus = (status: OrderBookConnectionStatus) => {
      if (!cancelled) {
        params.onStatusChange?.(status);
      }
    };

    // Reflect the socket's live health. `terminate` fires only once automatic
    // reconnection (maxRetries) is exhausted — that is the unrecoverable state
    // the UI surfaces with a manual reconnect button.
    const handleOpen = () => reportStatus('connected');
    const handleClose = () => reportStatus('connecting');
    const handleTerminate = () => {
      this.#terminated = true;
      reportStatus('error');
    };
    socket?.addEventListener('open', handleOpen);
    socket?.addEventListener('close', handleClose);
    socket?.addEventListener('terminate', handleTerminate);

    const removeSocketListeners = () => {
      socket?.removeEventListener('open', handleOpen);
      socket?.removeEventListener('close', handleClose);
      socket?.removeEventListener('terminate', handleTerminate);
    };

    reportStatus('connecting');

    // The SDK's typed `l2Book` subscription drops unknown fields, so it can't
    // request `fast` mode. Send the raw subscription payload through the
    // transport directly (this is exactly what the typed method does, minus the
    // validation) so `fast: true` reaches the server. The listener receives the
    // SDK's `CustomEvent`, whose `detail` is the `l2Book` snapshot.
    transport
      .subscribe<HyperliquidL2BookEvent>(
        'l2Book',
        {
          type: 'l2Book',
          coin: params.symbol,
          nSigFigs: params.nSigFigs ?? null,
          mantissa: params.mantissa ?? null,
          fast: true,
        },
        (event: { detail: HyperliquidL2BookEvent }) => {
          const data = event.detail;
          if (cancelled || data?.coin !== params.symbol || !data?.levels) {
            return;
          }
          params.callback(processAggregatedOrderBook(data, levels));
        },
      )
      .then((sub) => {
        if (cancelled) {
          sub.unsubscribe().catch(() => undefined);
          return;
        }
        subscription = sub;
        reportStatus('connected');
      })
      .catch((error) => {
        console.debug(
          '[AggregatedOrderBookConnection] subscribe failed',
          error,
        );
        reportStatus('error');
      });

    return () => {
      if (cancelled) {
        return;
      }
      cancelled = true;
      removeSocketListeners();
      if (subscription) {
        subscription.unsubscribe().catch(() => undefined);
        subscription = null;
      }
      this.#activeCount = Math.max(0, this.#activeCount - 1);
      if (this.#activeCount === 0) {
        this.#closeTransport();
      }
    };
  }

  /** Closes the dedicated socket and drops all subscriptions. */
  close(): void {
    this.#closeTransport();
  }

  #ensureTransport(isTestnet: boolean): WebSocketTransport {
    if (
      this.#transport &&
      this.#transportIsTestnet === isTestnet &&
      !this.#terminated
    ) {
      return this.#transport;
    }
    // First use, the network changed, or the previous socket was terminated —
    // (re)create the dedicated transport.
    this.#closeTransport();
    const transport = new WebSocketTransport({ isTestnet });
    this.#transport = transport;
    this.#transportIsTestnet = isTestnet;
    return transport;
  }

  #closeTransport(): void {
    const transport = this.#transport;
    this.#transport = null;
    this.#activeCount = 0;
    this.#terminated = false;
    if (transport) {
      transport.close().catch(() => undefined);
    }
  }
}
