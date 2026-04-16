import type {
  PerpsController,
  PerpsControllerState,
  CandlePeriod,
  TimeDuration,
} from '@metamask/perps-controller';
import type { Patch } from 'immer';

// Defined locally to avoid a value import from @metamask/perps-controller,
// which transitively pulls in the Hyperliquid SDK (ESM-only) and breaks Jest.
const WebSocketConnectionState = {
  Connected: 'connected',
  Connecting: 'connecting',
  Disconnected: 'disconnected',
  Disconnecting: 'disconnecting',
} as const;
type WebSocketConnectionState =
  (typeof WebSocketConnectionState)[keyof typeof WebSocketConnectionState];

type EmitFn = (
  channel: string,
  data: unknown,
  extra?: Record<string, unknown>,
) => void;

type ActivateStreamingParams = {
  priceSymbols?: string[];
  includeMarketData?: boolean;
  orderBookSymbol?: string;
  candle?: { symbol: string; interval: CandlePeriod; duration?: TimeDuration };
};

type StateChangeListener = (
  callback: (state: PerpsControllerState, patches: Patch[]) => void,
) => () => void;

type ConnectivityChangeListener = (
  callback: (state: { connectivityStatus: string }) => void,
) => () => void;

type PerpsStreamBridgeOptions = {
  controller: PerpsController;
  onControllerStateChange: StateChangeListener;
  onConnectivityChange: ConnectivityChangeListener;
  perpsInit: (...args: unknown[]) => Promise<unknown>;
  perpsDisconnect: (...args: unknown[]) => Promise<unknown>;
  perpsToggleTestnet: (...args: unknown[]) => Promise<unknown>;
  isConnectionAlive: () => boolean;
  emit: EmitFn;
};

const REST_HYDRATION_STAGGER_MS = 200;

/**
 * Per-connection bridge between the background PerpsController's WebSocket
 * subscriptions and a single UI outStream.
 *
 * Manages two categories of subscriptions:
 * Static (positions/orders/account): registered once via #activate() after
 * perpsInit resolves and the provider is ready.
 * Dynamic (prices/orderBook): single slot per channel; replaced on each call.
 * Candles: multiplexed by symbol+interval so multiple chart keys can stream
 * concurrently; each deactivate tears down only that key.
 *
 * Emission is gated by isActive, which requires both #activate() to have been
 * called and perpsViewActive(true) to be set. The UI calls perpsViewActive(true)
 * when PerpsLayout mounts and perpsViewActive(false) when it unmounts, ensuring
 * the background only pushes data while a Perps view is open.
 *
 * The only public members are the constructor, bridgeApi(), isActive, and
 * destroy(). All subscription management is internal.
 */
export class PerpsStreamBridge {
  #viewActive = false;

  readonly #controller: PerpsController;

  readonly #onControllerStateChange: StateChangeListener;

  readonly #onConnectivityChange: ConnectivityChangeListener;

  readonly #perpsInit: PerpsStreamBridgeOptions['perpsInit'];

  readonly #perpsDisconnect: PerpsStreamBridgeOptions['perpsDisconnect'];

  readonly #perpsToggleTestnet: PerpsStreamBridgeOptions['perpsToggleTestnet'];

  readonly #isConnectionAlive: () => boolean;

  readonly #emit: EmitFn;

  readonly #staticUnsubs: (() => void)[] = [];

  readonly #dynamicUnsubs: Record<string, () => void> = {};

  #activated = false;

  #wasDisconnected = false;

  #isHydrating = false;

  /** Bumped on each hydration start and on destroy() so stale #finally blocks cannot clear #isHydrating. */
  #hydrationSeq = 0;

  #lastMarketCacheKey: string | null = null;

  #wasDeviceOffline = false;

  constructor(options: PerpsStreamBridgeOptions) {
    this.#controller = options.controller;
    this.#onControllerStateChange = options.onControllerStateChange;
    this.#onConnectivityChange = options.onConnectivityChange;
    this.#perpsInit = options.perpsInit;
    this.#perpsDisconnect = options.perpsDisconnect;
    this.#perpsToggleTestnet = options.perpsToggleTestnet;
    this.#isConnectionAlive = options.isConnectionAlive;
    this.#emit = options.emit;
  }

  /**
   * Returns API method overrides for the metamask-controller RPC api object.
   * Encapsulates all perps-specific orchestration logic (init guards,
   * streaming lifecycle, view activation) so metamask-controller.js only
   * needs to spread this into the api object.
   *
   * @returns Record of perps stream method overrides
   */
  bridgeApi(): Record<string, (...args: never[]) => unknown> {
    return {
      perpsInit: async (...args: unknown[]) => {
        const result = await this.#perpsInit(...args);
        if (!this.#activated && this.#isConnectionAlive()) {
          this.#activate();
        }
        return result;
      },
      perpsDisconnect: async (...args: unknown[]) => {
        this.destroy();
        return this.#perpsDisconnect(...args);
      },
      perpsToggleTestnet: async (...args: unknown[]) => {
        this.destroy();
        return this.#perpsToggleTestnet(...args);
      },
      perpsViewActive: (active: boolean) => {
        this.#viewActive = active;
      },
      perpsActivateStreaming: async (params: ActivateStreamingParams) => {
        await this.#initAndActivate();
        if (this.#isConnectionAlive()) {
          this.#activateStreaming(params);
        }
        return 'ok';
      },
      perpsActivatePriceStream: async ({
        symbols,
        includeMarketData,
      }: {
        symbols: string[];
        includeMarketData?: boolean;
      }) => {
        await this.#initAndActivate();
        if (this.#isConnectionAlive()) {
          this.#activatePriceStream(symbols, includeMarketData);
        }
        return 'ok';
      },
      perpsDeactivatePriceStream: () => {
        this.#tearDownChannel('prices');
      },
      perpsActivateOrderBookStream: async ({ symbol }: { symbol: string }) => {
        await this.#initAndActivate();
        if (this.#isConnectionAlive()) {
          this.#activateOrderBookStream(symbol);
        }
        return 'ok';
      },
      perpsDeactivateOrderBookStream: () => {
        this.#tearDownChannel('orderBook');
      },
      perpsActivateCandleStream: async ({
        symbol,
        interval,
        duration,
      }: {
        symbol: string;
        interval: CandlePeriod;
        duration?: TimeDuration;
      }) => {
        await this.#initAndActivate();
        if (this.#isConnectionAlive()) {
          this.#activateCandleStream({ symbol, interval, duration });
        }
        return 'ok';
      },
      perpsDeactivateCandleStream: ({
        symbol,
        interval,
      }: {
        symbol: string;
        interval: CandlePeriod;
      }) => {
        if (!symbol || !interval) {
          return;
        }
        this.#tearDownDynamicKey(this.#candleSubscriptionKey(symbol, interval));
      },
      perpsCheckHealth: () => {
        if (!this.#activated) {
          return;
        }
        const state = this.#controller.getWebSocketConnectionState();
        if (state === WebSocketConnectionState.Disconnected) {
          this.#controller.reconnect().catch((err) => {
            console.debug(
              '[PerpsStreamBridge] health-check reconnect failed',
              err,
            );
          });
        }
      },
    };
  }

  get isActive(): boolean {
    return this.#activated && this.#viewActive;
  }

  destroy(): void {
    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    this.#tearDownAllDynamic();

    this.#activated = false;
    this.#viewActive = false;
    this.#wasDisconnected = false;
    this.#hydrationSeq += 1;
    this.#isHydrating = false;
    this.#lastMarketCacheKey = null;
    this.#wasDeviceOffline = false;
  }

  async #initAndActivate(): Promise<void> {
    await this.#perpsInit();
    if (!this.#activated && this.#isConnectionAlive()) {
      this.#activate();
    }
  }

  #activate(): void {
    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    this.#activated = true;

    try {
      this.#staticUnsubs.push(
        this.#controller.subscribeToPositions({
          callback: (data: unknown) => this.#emit('positions', data),
        }),
      );
      this.#staticUnsubs.push(
        this.#controller.subscribeToOrders({
          callback: (data: unknown) => this.#emit('orders', data),
        }),
      );
      this.#staticUnsubs.push(
        this.#controller.subscribeToAccount({
          callback: (data: unknown) => this.#emit('account', data),
        }),
      );
      this.#staticUnsubs.push(
        this.#controller.subscribeToOrderFills({
          callback: (data: unknown) => this.#emit('fills', data),
        }),
      );

      this.#staticUnsubs.push(
        this.#controller.subscribeToConnectionState(
          (state: WebSocketConnectionState) => {
            this.#handleConnectionStateChange(state);
          },
        ),
      );

      this.#staticUnsubs.push(
        this.#onControllerStateChange(
          (state: PerpsControllerState, _patches: Patch[]) => {
            this.#handleMarketDataPreload(state);
          },
        ),
      );

      this.#staticUnsubs.push(
        this.#onConnectivityChange((state: { connectivityStatus: string }) => {
          this.#handleConnectivityChange(state.connectivityStatus);
        }),
      );
    } catch (error) {
      this.#activated = false;
      for (const unsub of this.#staticUnsubs) {
        this.#callAndClearUnsub(unsub);
      }
      this.#staticUnsubs.length = 0;
      throw error;
    }
  }

  #handleConnectionStateChange(state: WebSocketConnectionState): void {
    this.#emit('connectionState', { state });

    if (state === WebSocketConnectionState.Disconnected) {
      this.#wasDisconnected = true;
      return;
    }

    if (state === WebSocketConnectionState.Connected && this.#wasDisconnected) {
      this.#wasDisconnected = false;
      this.#hydrateAfterReconnect();
    }
  }

  /**
   * Triggers a health check when the device transitions from offline to online.
   * @param status
   */
  #handleConnectivityChange(status: string): void {
    const isOffline = status === 'offline';
    const wasOffline = this.#wasDeviceOffline;
    this.#wasDeviceOffline = isOffline;

    if (wasOffline && !isOffline) {
      const wsState = this.#controller.getWebSocketConnectionState();
      if (wsState === WebSocketConnectionState.Disconnected) {
        this.#controller.reconnect().catch((err) => {
          console.debug(
            '[PerpsStreamBridge] connectivity-change reconnect failed',
            err,
          );
        });
      }
    }
  }

  /**
   * Reacts to controller state changes by checking if the cached market data
   * has been updated (e.g. by the background preloader after HIP-3 config
   * arrives from LaunchDarkly). Pushes updated data to the UI via the
   * existing 'markets' channel so the stream manager stays in sync.
   *
   * Note that this is only supports a single provider (non aggregated), meaning that if we added another provider outside of hyperliquid, we'd need to update this cache
   * @param state
   */
  #handleMarketDataPreload(state: PerpsControllerState): void {
    const provider = state.activeProvider ?? 'hyperliquid';
    const isTestnet = state.isTestnet ?? false;
    const cacheKey = `${provider}:${isTestnet ? 'testnet' : 'mainnet'}`;
    const entry = state.cachedMarketDataByProvider?.[cacheKey];

    if (!entry?.data || entry.data.length === 0) {
      return;
    }

    const snapshotKey = `${cacheKey}:${entry.timestamp}`;
    if (snapshotKey === this.#lastMarketCacheKey) {
      return;
    }
    this.#lastMarketCacheKey = snapshotKey;
    this.#emit('markets', entry.data);
  }

  /**
   * Fetches fresh data via REST after a WebSocket reconnection so the UI
   * doesn't show stale values while waiting for the first stream push.
   * Market data is fetched first (highest UI priority), then user data
   * after a short stagger to reduce burst pressure on the rate limiter.
   */
  async #hydrateAfterReconnect(): Promise<void> {
    if (this.#isHydrating || !this.#isConnectionAlive()) {
      return;
    }
    this.#isHydrating = true;
    this.#hydrationSeq += 1;
    const hydrationToken = this.#hydrationSeq;

    try {
      const marketsResult = await this.#controller
        .getMarketDataWithPrices()
        .catch(() => null);

      if (marketsResult) {
        this.#emit('markets', marketsResult);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, REST_HYDRATION_STAGGER_MS),
      );

      const [positionsResult, ordersResult, accountResult] =
        await Promise.allSettled([
          this.#controller.getPositions({ skipCache: true }),
          this.#controller.getOpenOrders(),
          this.#controller.getAccountState(),
        ]);

      if (positionsResult.status === 'fulfilled' && positionsResult.value) {
        this.#emit('positions', positionsResult.value);
      }
      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        this.#emit('orders', ordersResult.value);
      }
      if (accountResult.status === 'fulfilled') {
        this.#emit('account', accountResult.value ?? null);
      }
    } catch (err) {
      console.debug('[PerpsStreamBridge] post-reconnect hydration failed', err);
    } finally {
      if (hydrationToken === this.#hydrationSeq) {
        this.#isHydrating = false;
      }
    }
  }

  #activateStreaming(params: ActivateStreamingParams): void {
    const { priceSymbols, includeMarketData, orderBookSymbol, candle } = params;

    this.#tearDownAllDynamic();

    if (priceSymbols?.length) {
      this.#subscribeToPriceStream(priceSymbols, includeMarketData);
    }

    if (orderBookSymbol) {
      this.#addDynamicSubscription('orderBook', () =>
        this.#controller.subscribeToOrderBook({
          symbol: orderBookSymbol,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }

    if (candle?.symbol && candle?.interval) {
      const candleKey = this.#candleSubscriptionKey(
        candle.symbol,
        candle.interval,
      );
      this.#addDynamicSubscription(candleKey, () =>
        this.#controller.subscribeToCandles({
          ...candle,
          callback: (data: unknown) =>
            this.#emit('candles', data, {
              symbol: candle.symbol,
              interval: candle.interval,
            }),
        }),
      );
    }
  }

  #activatePriceStream(symbols: string[], includeMarketData?: boolean): void {
    this.#tearDownChannel('prices');
    if (symbols.length) {
      this.#subscribeToPriceStream(symbols, includeMarketData);
    }
  }

  #subscribeToPriceStream(
    symbols: string[],
    includeMarketData?: boolean,
  ): void {
    this.#addDynamicSubscription('prices', () =>
      this.#controller.subscribeToPrices({
        symbols,
        includeMarketData,
        callback: (data: unknown) => this.#emit('prices', data),
      }),
    );
  }

  #activateOrderBookStream(symbol: string): void {
    this.#tearDownChannel('orderBook');
    if (symbol) {
      this.#addDynamicSubscription('orderBook', () =>
        this.#controller.subscribeToOrderBook({
          symbol,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }
  }

  #activateCandleStream(params: {
    symbol: string;
    interval: CandlePeriod;
    duration?: TimeDuration;
  }): void {
    if (!params.symbol || !params.interval) {
      return;
    }
    const key = this.#candleSubscriptionKey(params.symbol, params.interval);
    this.#addDynamicSubscription(key, () =>
      this.#controller.subscribeToCandles({
        ...params,
        callback: (data: unknown) =>
          this.#emit('candles', data, {
            symbol: params.symbol,
            interval: params.interval,
          }),
      }),
    );
  }

  #candleSubscriptionKey(symbol: string, interval: CandlePeriod): string {
    return `candles:${symbol}:${interval}`;
  }

  #tearDownDynamicKey(key: string): void {
    const unsub = this.#dynamicUnsubs[key];
    if (unsub) {
      this.#callAndClearUnsub(unsub);
      delete this.#dynamicUnsubs[key];
    }
  }

  #callAndClearUnsub(unsub: () => void): void {
    try {
      unsub();
    } catch (error) {
      console.debug('[PerpsStreamBridge] cleanup error', error);
    }
  }

  #tearDownAllDynamic(): void {
    for (const unsub of Object.values(this.#dynamicUnsubs)) {
      this.#callAndClearUnsub(unsub);
    }
    for (const key of Object.keys(this.#dynamicUnsubs)) {
      delete this.#dynamicUnsubs[key];
    }
  }

  #tearDownChannel(channel: 'prices' | 'orderBook'): void {
    const unsub = this.#dynamicUnsubs[channel];
    if (unsub) {
      this.#callAndClearUnsub(unsub);
      delete this.#dynamicUnsubs[channel];
    }
  }

  #addDynamicSubscription(key: string, subscribe: () => () => void): void {
    this.#tearDownDynamicKey(key);
    this.#dynamicUnsubs[key] = subscribe();
  }
}
