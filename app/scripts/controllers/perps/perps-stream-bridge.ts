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

type PerpsStreamBridgeOptions = {
  controller: PerpsController;
  perpsInit: (...args: unknown[]) => Promise<unknown>;
  perpsDisconnect: (...args: unknown[]) => Promise<unknown>;
  perpsToggleTestnet: (...args: unknown[]) => Promise<unknown>;
  isConnectionAlive: () => boolean;
  emit: EmitFn;
};

/**
 * Per-connection bridge between the background PerpsController's WebSocket
 * subscriptions and a single UI outStream.
 *
 * Manages two categories of subscriptions:
 * Static (positions/orders/account): registered once via #activate() after
 * perpsInit resolves and the provider is ready.
 * Dynamic (prices/orderBook/candles): replaced on each streaming call so
 * navigating between markets doesn't leak subscriptions.
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

  readonly #perpsInit: PerpsStreamBridgeOptions['perpsInit'];

  readonly #perpsDisconnect: PerpsStreamBridgeOptions['perpsDisconnect'];

  readonly #perpsToggleTestnet: PerpsStreamBridgeOptions['perpsToggleTestnet'];

  readonly #isConnectionAlive: () => boolean;

  readonly #emit: EmitFn;

  readonly #staticUnsubs: (() => void)[] = [];

  readonly #dynamicUnsubs: Record<string, () => void> = {};

  #activated = false;

  constructor(options: PerpsStreamBridgeOptions) {
    this.#controller = options.controller;
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
      perpsActivatePriceStream: async ({ symbols }: { symbols: string[] }) => {
        await this.#initAndActivate();
        if (this.#isConnectionAlive()) {
          this.#activatePriceStream(symbols);
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
      perpsDeactivateCandleStream: () => {
        this.#tearDownChannel('candles');
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
    } catch (error) {
      this.#activated = false;
      for (const unsub of this.#staticUnsubs) {
        this.#callAndClearUnsub(unsub);
      }
      this.#staticUnsubs.length = 0;
      throw error;
    }
  }

  #activateStreaming(params: ActivateStreamingParams): void {
    const { priceSymbols, orderBookSymbol, candle } = params;

    this.#tearDownAllDynamic();

    if (priceSymbols?.length) {
      this.#addDynamicSubscription('prices', () =>
        this.#controller.subscribeToPrices({
          symbols: priceSymbols,
          callback: (data: unknown) => this.#emit('prices', data),
        }),
      );
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
      this.#addDynamicSubscription('candles', () =>
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

  #activatePriceStream(symbols: string[]): void {
    this.#tearDownChannel('prices');
    if (symbols.length) {
      this.#addDynamicSubscription('prices', () =>
        this.#controller.subscribeToPrices({
          symbols,
          callback: (data: unknown) => this.#emit('prices', data),
        }),
      );
    }
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
    this.#tearDownChannel('candles');
    if (params.symbol && params.interval) {
      this.#addDynamicSubscription('candles', () =>
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
}
