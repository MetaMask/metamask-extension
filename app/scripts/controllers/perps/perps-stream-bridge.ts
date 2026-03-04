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
 *   perpsInit resolves and the provider is ready. Calling activate() again
 *   tears down and re-registers statics (handles address changes).
 * - Dynamic (prices/orderBook/candles): replaced on each activateStreaming()
 *   call so navigating between markets doesn't leak subscriptions.
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
   */
  activate(controller: PerpsController): void {
    // Tear down any previous static subscriptions (handles re-activation)
    for (const unsub of this.#staticUnsubs) {
      try {
        unsub();
      } catch (error) {
        console.debug('[PerpsStreamBridge] cleanup error', error);
      }
    }
    this.#staticUnsubs.length = 0;

    this.#staticUnsubs.push(
      controller.subscribeToPositions({
        callback: (data: unknown) => this.#emit('positions', data),
      }),
      controller.subscribeToOrders({
        callback: (data: unknown) => this.#emit('orders', data),
      }),
      controller.subscribeToAccount({
        callback: (data: unknown) => this.#emit('account', data),
      }),
    );
    this.#activated = true;
  }

  #replaceSubscription(key: string, subscribe: () => () => void): void {
    this.#dynamicUnsubs[key]?.();
    this.#dynamicUnsubs[key] = subscribe();
  }

  setViewActive(active: boolean): void {
    this.#viewActive = active;
  }

  activateStreaming(
    controller: PerpsController,
    params: ActivateStreamingParams,
  ): void {
    const { priceSymbols, orderBookSymbol, candle } = params;

    if (priceSymbols?.length) {
      this.#replaceSubscription('prices', () =>
        controller.subscribeToPrices({
          symbols: priceSymbols,
          callback: (data: unknown) => this.#emit('prices', data),
        }),
      );
    }

    if (orderBookSymbol) {
      this.#replaceSubscription('orderBook', () =>
        controller.subscribeToOrderBook({
          symbol: orderBookSymbol,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }

    if (candle?.symbol && candle?.interval) {
      this.#replaceSubscription(
        `candles:${candle.symbol}:${candle.interval}`,
        () =>
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

  get isActive(): boolean {
    return this.#activated && this.#viewActive;
  }

  destroy(): void {
    const allUnsubs = [
      ...this.#staticUnsubs,
      ...Object.values(this.#dynamicUnsubs),
    ];
    for (const unsub of allUnsubs) {
      try {
        unsub();
      } catch (error) {
        console.debug('[PerpsStreamBridge] cleanup error', error);
      }
    }
  }
}
