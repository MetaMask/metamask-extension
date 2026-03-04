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
 * - Static (positions/orders/account): set once at construction, live for
 *   the lifetime of the connection.
 * - Dynamic (prices/orderBook/candles): replaced on each activateStreaming()
 *   call so navigating between markets doesn't leak subscriptions.
 */
export class PerpsStreamBridge {
  #subscriberCount = 0;

  readonly #emit: EmitFn;

  readonly #staticUnsubs: (() => void)[] = [];

  readonly #dynamicUnsubs: Record<string, () => void> = {};

  constructor(controller: PerpsController, emit: EmitFn) {
    this.#emit = emit;

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
  }

  #replaceSubscription(key: string, subscribe: () => () => void): void {
    this.#dynamicUnsubs[key]?.();
    this.#dynamicUnsubs[key] = subscribe();
  }

  subscriberChange(delta: number): void {
    this.#subscriberCount += delta;
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
    return this.#subscriberCount > 0;
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
