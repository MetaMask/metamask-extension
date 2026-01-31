/* eslint-disable import/no-restricted-paths */
/**
 * MockPerpsClient - Mock implementation of PerpsClient for development and testing
 *
 * This implementation uses the existing PerpsStreamManager channel classes
 * and mock data to provide a working client without a real backend.
 *
 * When the real @metamask/perps-controller is integrated, create a
 * ControllerPerpsClient that delegates to the actual controller.
 */

import type {
  PerpsClient,
  PerpsClientStreams,
  PerpsClientActions,
  PerpsClientConnection,
  PricesSubscribeParams,
  PositionsSubscribeParams,
  OrdersSubscribeParams,
  AccountSubscribeParams,
  OrderFillsSubscribeParams,
  OrderBookSubscribeParams,
  CandlesSubscribeParams,
  MarketDataSubscribeParams,
  OICapsSubscribeParams,
} from './PerpsClient.types';

import type {
  Position,
  Order,
  OrderFill,
  AccountState,
  PriceUpdate,
  PerpsMarketData,
  CandleData,
  OrderBookData,
  CandlePeriod,
  TimeDuration,
  WebSocketConnectionState,
} from '../../../app/scripts/controllers/perps/types';

import {
  MOCK_ACCOUNT,
  MOCK_MARKET_DATA,
  MOCK_ORDERS,
  MOCK_ORDER_FILLS,
  MOCK_POSITIONS,
  MOCK_MARKETS,
} from '../../../app/scripts/controllers/perps/mocks';

// ============================================================================
// Internal Types
// ============================================================================

interface StreamSubscription<T> {
  id: string;
  callback: (data: T) => void;
  throttleMs?: number;
}

interface StreamSubscriptionParams<T> {
  callback: (data: T) => void;
  throttleMs?: number;
}

// ============================================================================
// Base Stream Channel
// ============================================================================

/**
 * Abstract base class for stream channels
 * Provides subscribe/unsubscribe pattern with immediate mock data emission
 */
abstract class StreamChannel<T> {
  protected subscribers = new Map<string, StreamSubscription<T>>();
  protected isPaused = false;
  protected cache: T | null = null;

  protected abstract getMockData(): T;
  protected abstract getClearedData(): T;

  subscribe(params: StreamSubscriptionParams<T>): () => void {
    const id = Math.random().toString(36).substring(2, 9);

    const subscription: StreamSubscription<T> = {
      id,
      callback: params.callback,
      throttleMs: params.throttleMs,
    };

    this.subscribers.set(id, subscription);

    // Immediately emit mock data
    if (!this.isPaused) {
      const data = this.cache ?? this.getMockData();
      this.cache = data;
      params.callback(data);
    }

    return () => {
      this.subscribers.delete(id);
    };
  }

  protected notifySubscribers(data: T): void {
    if (this.isPaused) {
      return;
    }
    this.subscribers.forEach((subscriber) => {
      subscriber.callback(data);
    });
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  disconnect(): void {
    this.subscribers.clear();
    this.cache = null;
  }
}

// ============================================================================
// Channel Implementations
// ============================================================================

class PriceStreamChannel extends StreamChannel<Record<string, PriceUpdate>> {
  private symbols = new Set<string>();

  protected getMockData(): Record<string, PriceUpdate> {
    const prices: Record<string, PriceUpdate> = {};
    MOCK_MARKET_DATA.forEach((market) => {
      const priceStr = market.price.replace(/[$,]/gu, '');
      const price = parseFloat(priceStr) || 0;

      prices[market.symbol] = {
        symbol: market.symbol,
        price: price.toString(),
        timestamp: Date.now(),
        percentChange24h: market.change24hPercent,
        funding: market.fundingRate,
        openInterest: market.openInterest
          ? parseFloat(market.openInterest.replace(/[$,BMK]/gu, '')) * 1e6
          : undefined,
        volume24h: market.volume
          ? parseFloat(market.volume.replace(/[$,BMK]/gu, '')) * 1e6
          : undefined,
      };
    });
    return prices;
  }

  protected getClearedData(): Record<string, PriceUpdate> {
    return {};
  }

  subscribeToSymbols(params: {
    symbols: string[];
    callback: (prices: PriceUpdate[]) => void;
    throttleMs?: number;
  }): () => void {
    params.symbols.forEach((s) => this.symbols.add(s));

    return this.subscribe({
      callback: (allPrices) => {
        // Convert Record to array and filter to requested symbols
        const filtered = params.symbols
          .map((symbol) => allPrices[symbol])
          .filter((p): p is PriceUpdate => p !== undefined);
        params.callback(filtered);
      },
      throttleMs: params.throttleMs,
    });
  }
}

class PositionStreamChannel extends StreamChannel<Position[]> {
  protected getMockData(): Position[] {
    return MOCK_POSITIONS;
  }

  protected getClearedData(): Position[] {
    return [];
  }
}

class OrderStreamChannel extends StreamChannel<Order[]> {
  protected getMockData(): Order[] {
    return MOCK_ORDERS;
  }

  protected getClearedData(): Order[] {
    return [];
  }
}

class AccountStreamChannel extends StreamChannel<AccountState | null> {
  protected getMockData(): AccountState | null {
    return MOCK_ACCOUNT;
  }

  protected getClearedData(): AccountState | null {
    return null;
  }
}

class FillStreamChannel extends StreamChannel<OrderFill[]> {
  protected getMockData(): OrderFill[] {
    return MOCK_ORDER_FILLS;
  }

  protected getClearedData(): OrderFill[] {
    return [];
  }
}

class MarketDataChannel extends StreamChannel<PerpsMarketData[]> {
  protected getMockData(): PerpsMarketData[] {
    return MOCK_MARKET_DATA;
  }

  protected getClearedData(): PerpsMarketData[] {
    return [];
  }
}

class OICapStreamChannel extends StreamChannel<string[]> {
  protected getMockData(): string[] {
    return ['100000000', '50000000', '25000000'];
  }

  protected getClearedData(): string[] {
    return [];
  }
}

class OrderBookStreamChannel extends StreamChannel<OrderBookData | null> {
  private currentSymbol: string | null = null;

  protected getMockData(): OrderBookData | null {
    if (!this.currentSymbol) {
      return null;
    }

    const market = MOCK_MARKET_DATA.find((m) => m.symbol === this.currentSymbol);
    if (!market) {
      return null;
    }

    const priceStr = market.price.replace(/[$,]/gu, '');
    const basePrice = parseFloat(priceStr) || 65000;

    const bids = [];
    const asks = [];
    let bidTotal = 0;
    let askTotal = 0;

    for (let i = 0; i < 10; i++) {
      const bidPrice = basePrice - (i + 1) * 10;
      const askPrice = basePrice + (i + 1) * 10;
      const bidSize = 0.1 + Math.random() * 0.5;
      const askSize = 0.1 + Math.random() * 0.5;

      bidTotal += bidSize;
      askTotal += askSize;

      bids.push({
        price: bidPrice.toFixed(2),
        size: bidSize.toFixed(4),
        total: bidTotal.toFixed(4),
        notional: (bidPrice * bidSize).toFixed(2),
        totalNotional: (bidPrice * bidTotal).toFixed(2),
      });

      asks.push({
        price: askPrice.toFixed(2),
        size: askSize.toFixed(4),
        total: askTotal.toFixed(4),
        notional: (askPrice * askSize).toFixed(2),
        totalNotional: (askPrice * askTotal).toFixed(2),
      });
    }

    const spread = parseFloat(asks[0].price) - parseFloat(bids[0].price);
    const midPrice = (parseFloat(asks[0].price) + parseFloat(bids[0].price)) / 2;

    return {
      bids,
      asks,
      spread: spread.toFixed(2),
      spreadPercentage: ((spread / midPrice) * 100).toFixed(4),
      midPrice: midPrice.toFixed(2),
      lastUpdated: Date.now(),
      maxTotal: Math.max(bidTotal, askTotal).toFixed(4),
    };
  }

  protected getClearedData(): OrderBookData | null {
    return null;
  }

  subscribeToOrderBook(params: {
    symbol: string;
    levels?: number;
    callback: (orderBook: OrderBookData) => void;
    onError?: (error: Error) => void;
  }): () => void {
    this.currentSymbol = params.symbol;
    this.cache = null;

    return this.subscribe({
      callback: (data) => {
        if (data) {
          params.callback(data);
        }
      },
    });
  }
}

class CandleStreamChannel extends StreamChannel<CandleData | null> {
  private currentSymbol: string | null = null;
  private currentInterval: CandlePeriod | null = null;

  protected getMockData(): CandleData | null {
    if (!this.currentSymbol || !this.currentInterval) {
      return null;
    }

    const now = Date.now();
    const candles = [];
    const basePrice = 65000;

    for (let i = 49; i >= 0; i--) {
      const time = now - i * 60000;
      const open = basePrice + Math.random() * 1000 - 500;
      const close = open + Math.random() * 200 - 100;
      const high = Math.max(open, close) + Math.random() * 100;
      const low = Math.min(open, close) - Math.random() * 100;
      const volume = 1000000 + Math.random() * 500000;

      candles.push({
        time,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume.toFixed(0),
      });
    }

    return {
      symbol: this.currentSymbol,
      interval: this.currentInterval,
      candles,
    };
  }

  protected getClearedData(): CandleData | null {
    return null;
  }

  subscribeToCandles(params: {
    symbol: string;
    interval: CandlePeriod;
    duration?: TimeDuration;
    callback: (data: CandleData) => void;
    onError?: (error: Error) => void;
  }): () => void {
    this.currentSymbol = params.symbol;
    this.currentInterval = params.interval;
    this.cache = null;

    return this.subscribe({
      callback: (data) => {
        if (data) {
          params.callback(data);
        }
      },
    });
  }
}

// ============================================================================
// Mock Client Factory
// ============================================================================

/**
 * Creates a mock PerpsClient for development and testing
 *
 * This factory creates stream channels and wires them up to the
 * PerpsClient interface, adapting the channel APIs to match the
 * real controller's subscription signatures.
 *
 * @returns PerpsClient instance with mock data
 */
export function createMockPerpsClient(): PerpsClient {
  // Create channel instances
  const priceChannel = new PriceStreamChannel();
  const positionChannel = new PositionStreamChannel();
  const orderChannel = new OrderStreamChannel();
  const accountChannel = new AccountStreamChannel();
  const fillChannel = new FillStreamChannel();
  const orderBookChannel = new OrderBookStreamChannel();
  const candleChannel = new CandleStreamChannel();
  const marketDataChannel = new MarketDataChannel();
  const oiCapChannel = new OICapStreamChannel();

  // Build streams interface
  const streams: PerpsClientStreams = {
    prices: {
      subscribe: (params: PricesSubscribeParams) => {
        return priceChannel.subscribeToSymbols({
          symbols: params.symbols,
          callback: params.callback,
          throttleMs: params.throttleMs,
        });
      },
    },

    positions: {
      subscribe: (params: PositionsSubscribeParams) => {
        return positionChannel.subscribe({
          callback: params.callback,
        });
      },
    },

    orders: {
      subscribe: (params: OrdersSubscribeParams) => {
        return orderChannel.subscribe({
          callback: params.callback,
        });
      },
    },

    account: {
      subscribe: (params: AccountSubscribeParams) => {
        return accountChannel.subscribe({
          callback: (account) => {
            // Filter out null - real controller always provides AccountState
            if (account) {
              params.callback(account);
            }
          },
        });
      },
    },

    orderFills: {
      subscribe: (params: OrderFillsSubscribeParams) => {
        return fillChannel.subscribe({
          callback: (fills) => {
            params.callback(fills, true); // isSnapshot = true for mock
          },
        });
      },
    },

    orderBook: {
      subscribe: (params: OrderBookSubscribeParams) => {
        return orderBookChannel.subscribeToOrderBook({
          symbol: params.symbol,
          levels: params.levels,
          callback: params.callback,
          onError: params.onError,
        });
      },
    },

    candles: {
      subscribe: (params: CandlesSubscribeParams) => {
        return candleChannel.subscribeToCandles({
          symbol: params.symbol,
          interval: params.interval,
          duration: params.duration,
          callback: params.callback,
          onError: params.onError,
        });
      },
    },

    marketData: {
      subscribe: (params: MarketDataSubscribeParams) => {
        return marketDataChannel.subscribe({
          callback: params.callback,
        });
      },
    },

    oiCaps: {
      subscribe: (params: OICapsSubscribeParams) => {
        return oiCapChannel.subscribe({
          callback: params.callback,
        });
      },
    },
  };

  // Build actions interface (mock implementations)
  const actions: PerpsClientActions = {
    placeOrder: async (_params) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        success: true,
        orderId: `mock-order-${Date.now()}`,
      };
    },

    closePosition: async (_params) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        success: true,
        orderId: `mock-close-${Date.now()}`,
      };
    },

    cancelOrder: async (params) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        success: true,
        orderId: params.orderId,
      };
    },

    withdraw: async (_params) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        success: true,
        withdrawalId: `mock-wd-${Date.now()}`,
      };
    },

    getMarkets: async () => {
      return MOCK_MARKETS;
    },

    getPositions: async () => {
      return MOCK_POSITIONS;
    },

    getOrders: async () => {
      return MOCK_ORDERS;
    },

    getAccountState: async () => {
      return MOCK_ACCOUNT;
    },
  };

  // Build connection interface (mock - always connected)
  const connection: PerpsClientConnection = {
    getState: () => {
      // Import WebSocketConnectionState enum value
      return 'connected' as WebSocketConnectionState;
    },

    subscribe: (listener) => {
      // Immediately notify of connected state
      listener('connected' as WebSocketConnectionState, 0);
      // Return no-op unsubscribe
      return () => {};
    },

    reconnect: async () => {
      // No-op for mock
    },
  };

  return {
    streams,
    actions,
    connection,
  };
}
