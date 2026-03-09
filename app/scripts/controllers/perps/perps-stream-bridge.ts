import type {
  PerpsController,
  CandlePeriod,
  TimeDuration,
} from '@metamask/perps-controller';

type EmitFn = (
  channel: string,
  data: unknown,
  extra?: Record<string, unknown>,
) => void;

type ActivateStreamingParams = {
  priceSymbols?: string[];
  orderBookSymbol?: string;
  candle?: { symbol: string; interval: CandlePeriod; duration?: TimeDuration };
};

/**
 * Per-connection bridge between the background PerpsController's WebSocket
 * subscriptions and a single UI outStream.
 *
 * Manages two categories of subscriptions:
 * - Static (positions/orders/account): registered once via activate() after
 * perpsInit resolves and the provider is ready. Calling activate() again
 * tears down and re-registers statics (handles address changes).
 * - Dynamic (prices/orderBook/candles): replaced on each activateStreaming()
 * call so navigating between markets doesn't leak subscriptions.
 *
 * Emission is gated by isActive, which requires both activate() to have been
 * called and setViewActive(true) to be set. The UI calls setViewActive(true)
 * when PerpsLayout mounts and setViewActive(false) when it unmounts, ensuring
 * the background only pushes data while a Perps view is open.
 */
export class PerpsStreamBridge {
  #viewActive = false;

  readonly #emit: EmitFn;

  readonly #staticUnsubs: (() => void)[] = [];

  readonly #dynamicUnsubs: Record<string, () => void> = {};

  #activated = false;

  constructor(emit: EmitFn) {
    this.#emit = emit;
  }

  /**
   * Register static subscriptions (positions, orders, account) after the
   * controller provider is guaranteed to be ready. Idempotent — subsequent
   * calls tear down existing statics and re-subscribe so an address change
   * is handled cleanly.
   *
   * @param controller - The initialized PerpsController instance
   */
  activate(controller: PerpsController): void {
    // Tear down any previous static subscriptions (handles re-activation)
    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    // Register each perps subscription individually so that if one throws, th unsub functions already returned by earlier calls are safely stored and can be cleaned up by a subsequent destroy()
    this.#staticUnsubs.push(
      controller.subscribeToPositions({
        callback: (data: unknown) => this.#emit('positions', data),
      }),
    );
    this.#staticUnsubs.push(
      controller.subscribeToOrders({
        callback: (data: unknown) => this.#emit('orders', data),
      }),
    );
    this.#staticUnsubs.push(
      controller.subscribeToAccount({
        callback: (data: unknown) => this.#emit('account', data),
      }),
    );
    this.#staticUnsubs.push(
      controller.subscribeToOrderFills({
        callback: (data: unknown) => this.#emit('fills', data),
      }),
    );
    this.#activated = true;
  }

  setViewActive(active: boolean): void {
    this.#viewActive = active;
  }

  activateStreaming(
    controller: PerpsController,
    params: ActivateStreamingParams,
  ): void {
    const { priceSymbols, orderBookSymbol, candle } = params;

    // Tear down ALL existing dynamic subs first so channels omitted from
    // params don't leak (e.g. navigating from a detailed view to a simpler
    // one that no longer needs orderBook or candles).
    this.#tearDownAllDynamic();

    if (priceSymbols?.length) {
      this.#addDynamicSubscription('prices', () =>
        controller.subscribeToPrices({
          symbols: priceSymbols,
          callback: (data: unknown) => this.#emit('prices', data),
        }),
      );
    }

    if (orderBookSymbol) {
      this.#addDynamicSubscription('orderBook', () =>
        controller.subscribeToOrderBook({
          symbol: orderBookSymbol,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }

    if (candle?.symbol && candle?.interval) {
      this.#addDynamicSubscription('candles', () =>
        controller.subscribeToCandles({
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

  activatePriceStream(controller: PerpsController, symbols: string[]): void {
    this.#tearDownChannel('prices');
    if (symbols.length) {
      this.#addDynamicSubscription('prices', () =>
        controller.subscribeToPrices({
          symbols,
          callback: (data: unknown) => this.#emit('prices', data),
        }),
      );
    }
  }

  deactivatePriceStream(): void {
    this.#tearDownChannel('prices');
  }

  activateOrderBookStream(controller: PerpsController, symbol: string): void {
    this.#tearDownChannel('orderBook');
    if (symbol) {
      this.#addDynamicSubscription('orderBook', () =>
        controller.subscribeToOrderBook({
          symbol,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }
  }

  deactivateOrderBookStream(): void {
    this.#tearDownChannel('orderBook');
  }

  activateCandleStream(
    controller: PerpsController,
    params: { symbol: string; interval: CandlePeriod; duration?: TimeDuration },
  ): void {
    this.#tearDownChannel('candles');
    if (params.symbol && params.interval) {
      this.#addDynamicSubscription('candles', () =>
        controller.subscribeToCandles({
          ...params,
          callback: (data: unknown) =>
            this.#emit('candles', data, {
              symbol: params.symbol,
              interval: params.interval,
            }),
        }),
      );
    }
  }

  deactivateCandleStream(): void {
    this.#tearDownChannel('candles');
  }

  get isActive(): boolean {
    return this.#activated && this.#viewActive;
  }

  get isActivated(): boolean {
    return this.#activated;
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

  #tearDownChannel(channel: 'prices' | 'orderBook' | 'candles'): void {
    const unsub = this.#dynamicUnsubs[channel];
    if (unsub) {
      this.#callAndClearUnsub(unsub);
      delete this.#dynamicUnsubs[channel];
    }
  }

  #addDynamicSubscription(key: string, subscribe: () => () => void): void {
    this.#dynamicUnsubs[key] = subscribe();
  }

  destroy(): void {
    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    this.#tearDownAllDynamic();

    this.#activated = false;
    this.#viewActive = false;
  }
}
