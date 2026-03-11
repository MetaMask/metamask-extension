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
  controller: PerpsController | undefined;
  controllerApi: {
    perpsInit: (...args: unknown[]) => Promise<unknown>;
    perpsDisconnect: (...args: unknown[]) => Promise<unknown>;
    perpsToggleTestnet: (...args: unknown[]) => Promise<unknown>;
  };
  isConnectionAlive: () => boolean;
  emit: EmitFn;
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

  readonly #controller: PerpsController | undefined;

  readonly #controllerApi: PerpsStreamBridgeOptions['controllerApi'];

  readonly #isConnectionAlive: () => boolean;

  readonly #emit: EmitFn;

  readonly #staticUnsubs: (() => void)[] = [];

  readonly #dynamicUnsubs: Record<string, () => void> = {};

  #activated = false;

  constructor(options: PerpsStreamBridgeOptions) {
    this.#controller = options.controller;
    this.#controllerApi = options.controllerApi;
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
    const self = this;
    return {
      perpsInit: async (...args: unknown[]) => {
        const result = await self.#controllerApi.perpsInit(...args);
        if (self.#controller && !self.#activated && self.#isConnectionAlive()) {
          self.activate();
        }
        return result;
      },
      perpsDisconnect: async (...args: unknown[]) => {
        self.destroy();
        return self.#controllerApi.perpsDisconnect(...args);
      },
      perpsToggleTestnet: async (...args: unknown[]) => {
        self.destroy();
        return self.#controllerApi.perpsToggleTestnet(...args);
      },
      perpsViewActive: (active: boolean) => {
        self.setViewActive(active);
      },
      perpsActivateStreaming: async (params: ActivateStreamingParams) => {
        await self.#controllerApi.perpsInit();
        if (self.#controller && self.#isConnectionAlive()) {
          self.activateStreaming(params);
        }
        return 'ok';
      },
      perpsActivatePriceStream: async ({ symbols }: { symbols: string[] }) => {
        await self.#controllerApi.perpsInit();
        if (self.#controller && self.#isConnectionAlive()) {
          self.activatePriceStream(symbols);
        }
        return 'ok';
      },
      perpsDeactivatePriceStream: () => {
        self.deactivatePriceStream();
      },
      perpsActivateOrderBookStream: async ({ symbol }: { symbol: string }) => {
        await self.#controllerApi.perpsInit();
        if (self.#controller && self.#isConnectionAlive()) {
          self.activateOrderBookStream(symbol);
        }
        return 'ok';
      },
      perpsDeactivateOrderBookStream: () => {
        self.deactivateOrderBookStream();
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
        await self.#controllerApi.perpsInit();
        if (self.#controller && self.#isConnectionAlive()) {
          self.activateCandleStream({ symbol, interval, duration });
        }
        return 'ok';
      },
      perpsDeactivateCandleStream: () => {
        self.deactivateCandleStream();
      },
    };
  }

  /**
   * Register static subscriptions (positions, orders, account) after the
   * controller provider is guaranteed to be ready. Idempotent — subsequent
   * calls tear down existing statics and re-subscribe so an address change
   * is handled cleanly.
   */
  activate(): void {
    const controller = this.#controller;
    if (!controller) {
      return;
    }

    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    this.#activated = true;

    try {
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
    } catch (error) {
      this.#activated = false;
      for (const unsub of this.#staticUnsubs) {
        this.#callAndClearUnsub(unsub);
      }
      this.#staticUnsubs.length = 0;
      throw error;
    }
  }

  setViewActive(active: boolean): void {
    this.#viewActive = active;
  }

  activateStreaming(params: ActivateStreamingParams): void {
    const controller = this.#controller;
    if (!controller) {
      return;
    }

    const { priceSymbols, orderBookSymbol, candle } = params;

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

  activatePriceStream(symbols: string[]): void {
    const controller = this.#controller;
    if (!controller) {
      return;
    }

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

  activateOrderBookStream(symbol: string): void {
    const controller = this.#controller;
    if (!controller) {
      return;
    }

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

  activateCandleStream(params: {
    symbol: string;
    interval: CandlePeriod;
    duration?: TimeDuration;
  }): void {
    const controller = this.#controller;
    if (!controller) {
      return;
    }

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
