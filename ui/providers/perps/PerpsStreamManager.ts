/**
 * PerpsStreamManager - Manages real-time data streams for Perps UI
 *
 * This is a mock implementation that provides the same API as the mobile version
 * but returns mock data immediately. When the real controller is integrated,
 * channels will connect to actual WebSocket subscriptions.
 */

import type {
  AccountState,
  CandleData,
  Order,
  OrderBookData,
  OrderFill,
  PerpsMarketData,
  Position,
  PriceUpdate,
  CandlePeriod,
  TimeDuration,
} from '../../../app/scripts/controllers/perps/types';

import {
  MOCK_ACCOUNT,
  MOCK_MARKET_DATA,
  MOCK_ORDERS,
  MOCK_ORDER_FILLS,
  MOCK_POSITIONS,
} from '../../../app/scripts/controllers/perps/mocks';

// ============================================================================
// Types
// ============================================================================

/**
 * Subscription parameters for stream channels
 */
export interface StreamSubscriptionParams<T> {
  callback: (data: T) => void;
  throttleMs?: number;
}

/**
 * Internal subscription tracking
 */
interface StreamSubscription<T> {
  id: string;
  callback: (data: T) => void;
  throttleMs?: number;
}

/**
 * Top of book data structure
 */
export interface TopOfBookData {
  bestBid?: string;
  bestAsk?: string;
  spread?: string;
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

  /**
   * Get mock data to emit to subscribers
   * Subclasses must implement this
   */
  protected abstract getMockData(): T;

  /**
   * Get cleared/empty data state
   * Subclasses must implement this
   */
  protected abstract getClearedData(): T;

  /**
   * Subscribe to data updates
   * Immediately emits mock data, returns unsubscribe function
   */
  subscribe(params: StreamSubscriptionParams<T>): () => void {
    const id = Math.random().toString(36).substring(2, 9);

    const subscription: StreamSubscription<T> = {
      id,
      callback: params.callback,
      throttleMs: params.throttleMs,
    };

    this.subscribers.set(id, subscription);

    // Immediately emit mock data (simulating cached data)
    if (!this.isPaused) {
      const data = this.cache ?? this.getMockData();
      this.cache = data;
      params.callback(data);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Notify all subscribers with new data
   */
  protected notifySubscribers(data: T): void {
    if (this.isPaused) {
      return;
    }

    this.subscribers.forEach((subscriber) => {
      subscriber.callback(data);
    });
  }

  /**
   * Pause emission of updates to subscribers
   * WebSocket connection stays alive in real implementation
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume emission of updates to subscribers
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Disconnect the channel and clear subscribers
   */
  disconnect(): void {
    this.subscribers.clear();
    this.cache = null;
  }

  /**
   * Clear cache and notify subscribers with empty data
   */
  clearCache(): void {
    this.cache = null;
    const clearedData = this.getClearedData();
    this.subscribers.forEach((subscriber) => {
      subscriber.callback(clearedData);
    });
  }

  /**
   * Prewarm the channel (no-op for mock)
   * Returns cleanup function
   */
  prewarm(): () => void {
    // In mock, just ensure cache is populated
    if (!this.cache) {
      this.cache = this.getMockData();
    }
    return () => {
      // No-op cleanup
    };
  }
}

// ============================================================================
// Price Stream Channel
// ============================================================================

/**
 * Channel for real-time price updates
 */
class PriceStreamChannel extends StreamChannel<Record<string, PriceUpdate>> {
  private symbols = new Set<string>();

  protected getMockData(): Record<string, PriceUpdate> {
    const prices: Record<string, PriceUpdate> = {};
    MOCK_MARKET_DATA.forEach((market) => {
      // Extract numeric price from formatted string
      const priceStr = market.price.replace(/[$,]/g, '');
      const price = parseFloat(priceStr) || 0;

      prices[market.symbol] = {
        symbol: market.symbol,
        price: price.toString(),
        timestamp: Date.now(),
        percentChange24h: market.change24hPercent,
        funding: market.fundingRate,
        openInterest: market.openInterest
          ? parseFloat(market.openInterest.replace(/[$,BMK]/g, '')) * 1e6
          : undefined,
        volume24h: market.volume
          ? parseFloat(market.volume.replace(/[$,BMK]/g, '')) * 1e6
          : undefined,
      };
    });
    return prices;
  }

  protected getClearedData(): Record<string, PriceUpdate> {
    return {};
  }

  /**
   * Subscribe to specific symbols
   */
  subscribeToSymbols(params: {
    symbols: string[];
    callback: (prices: Record<string, PriceUpdate>) => void;
    throttleMs?: number;
  }): () => void {
    params.symbols.forEach((s) => this.symbols.add(s));

    return this.subscribe({
      callback: (allPrices) => {
        // Filter to only requested symbols
        const filtered: Record<string, PriceUpdate> = {};
        params.symbols.forEach((symbol) => {
          if (allPrices[symbol]) {
            filtered[symbol] = allPrices[symbol];
          }
        });
        params.callback(filtered);
      },
      throttleMs: params.throttleMs,
    });
  }
}

// ============================================================================
// Position Stream Channel
// ============================================================================

/**
 * Channel for real-time position updates
 */
class PositionStreamChannel extends StreamChannel<Position[]> {
  protected getMockData(): Position[] {
    return MOCK_POSITIONS;
  }

  protected getClearedData(): Position[] {
    return [];
  }

  /**
   * Apply optimistic update for TP/SL prices
   */
  updatePositionTPSLOptimistic(
    symbol: string,
    takeProfitPrice: string | undefined,
    stopLossPrice: string | undefined,
  ): void {
    if (!this.cache) {
      return;
    }

    const updatedPositions = this.cache.map((position) => {
      if (position.symbol === symbol) {
        return {
          ...position,
          takeProfitPrice,
          stopLossPrice,
          takeProfitCount: takeProfitPrice ? 1 : 0,
          stopLossCount: stopLossPrice ? 1 : 0,
        };
      }
      return position;
    });

    this.cache = updatedPositions;
    this.notifySubscribers(updatedPositions);
  }
}

// ============================================================================
// Order Stream Channel
// ============================================================================

/**
 * Channel for real-time order updates
 */
class OrderStreamChannel extends StreamChannel<Order[]> {
  protected getMockData(): Order[] {
    return MOCK_ORDERS;
  }

  protected getClearedData(): Order[] {
    return [];
  }
}

// ============================================================================
// Account Stream Channel
// ============================================================================

/**
 * Channel for real-time account state updates
 */
class AccountStreamChannel extends StreamChannel<AccountState | null> {
  protected getMockData(): AccountState | null {
    return MOCK_ACCOUNT;
  }

  protected getClearedData(): AccountState | null {
    return null;
  }
}

// ============================================================================
// Fill Stream Channel
// ============================================================================

/**
 * Channel for order fill updates
 */
class FillStreamChannel extends StreamChannel<OrderFill[]> {
  protected getMockData(): OrderFill[] {
    return MOCK_ORDER_FILLS;
  }

  protected getClearedData(): OrderFill[] {
    return [];
  }
}

// ============================================================================
// Market Data Channel
// ============================================================================

/**
 * Channel for market data with prices
 */
class MarketDataChannel extends StreamChannel<PerpsMarketData[]> {
  protected getMockData(): PerpsMarketData[] {
    return MOCK_MARKET_DATA;
  }

  protected getClearedData(): PerpsMarketData[] {
    return [];
  }

  /**
   * Force refresh market data
   */
  async refresh(): Promise<void> {
    this.cache = this.getMockData();
    this.notifySubscribers(this.cache);
  }
}

// ============================================================================
// OI Cap Stream Channel
// ============================================================================

/**
 * Channel for open interest cap updates
 */
class OICapStreamChannel extends StreamChannel<string[]> {
  protected getMockData(): string[] {
    // Mock OI caps - markets at capacity
    return ['100000000', '50000000', '25000000'];
  }

  protected getClearedData(): string[] {
    return [];
  }
}

// ============================================================================
// Top of Book Stream Channel
// ============================================================================

/**
 * Channel for top of book (best bid/ask) updates
 */
class TopOfBookStreamChannel extends StreamChannel<TopOfBookData | undefined> {
  private currentSymbol: string | null = null;

  protected getMockData(): TopOfBookData | undefined {
    if (!this.currentSymbol) {
      return undefined;
    }

    // Find the market and derive bid/ask from price
    const market = MOCK_MARKET_DATA.find(
      (m) => m.symbol === this.currentSymbol,
    );
    if (!market) {
      return undefined;
    }

    const priceStr = market.price.replace(/[$,]/g, '');
    const price = parseFloat(priceStr) || 0;

    // Mock spread of 0.01%
    const spreadPercent = 0.0001;
    const halfSpread = price * spreadPercent * 0.5;

    return {
      bestBid: (price - halfSpread).toFixed(2),
      bestAsk: (price + halfSpread).toFixed(2),
      spread: (halfSpread * 2).toFixed(2),
    };
  }

  protected getClearedData(): TopOfBookData | undefined {
    return undefined;
  }

  /**
   * Subscribe to a specific symbol's top of book
   */
  subscribeToSymbol(params: {
    symbol: string;
    callback: (data: TopOfBookData | undefined) => void;
  }): () => void {
    // If symbol changed, disconnect old subscription
    if (this.currentSymbol && this.currentSymbol !== params.symbol) {
      this.disconnect();
    }

    this.currentSymbol = params.symbol;
    this.cache = null; // Clear cache to get fresh data for new symbol

    return this.subscribe({
      callback: params.callback,
    });
  }

  disconnect(): void {
    this.currentSymbol = null;
    super.disconnect();
  }
}

// ============================================================================
// Candle Stream Channel
// ============================================================================

/**
 * Channel for candlestick data
 */
class CandleStreamChannel extends StreamChannel<CandleData | null> {
  private currentSymbol: string | null = null;
  private currentInterval: CandlePeriod | null = null;

  protected getMockData(): CandleData | null {
    if (!this.currentSymbol || !this.currentInterval) {
      return null;
    }

    // Generate mock candle data
    const now = Date.now();
    const candles = [];
    const basePrice = 65000; // Mock base price

    for (let i = 49; i >= 0; i--) {
      const time = now - i * 60000; // 1 minute intervals
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

  /**
   * Subscribe to candles for a specific symbol and interval
   */
  subscribeToCandles(params: {
    symbol: string;
    interval: CandlePeriod;
    duration?: TimeDuration;
    callback: (data: CandleData) => void;
    onError?: (error: Error) => void;
  }): () => void {
    this.currentSymbol = params.symbol;
    this.currentInterval = params.interval;
    this.cache = null; // Clear cache for new symbol/interval

    return this.subscribe({
      callback: (data) => {
        if (data) {
          params.callback(data);
        }
      },
    });
  }

  disconnect(): void {
    this.currentSymbol = null;
    this.currentInterval = null;
    super.disconnect();
  }
}

// ============================================================================
// Order Book Stream Channel
// ============================================================================

/**
 * Channel for full order book data
 */
class OrderBookStreamChannel extends StreamChannel<OrderBookData | null> {
  private currentSymbol: string | null = null;

  protected getMockData(): OrderBookData | null {
    if (!this.currentSymbol) {
      return null;
    }

    // Find the market to get base price
    const market = MOCK_MARKET_DATA.find(
      (m) => m.symbol === this.currentSymbol,
    );
    if (!market) {
      return null;
    }

    const priceStr = market.price.replace(/[$,]/g, '');
    const basePrice = parseFloat(priceStr) || 65000;

    // Generate mock order book levels
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

  /**
   * Subscribe to order book for a specific symbol
   */
  subscribeToOrderBook(params: {
    symbol: string;
    levels?: number;
    nSigFigs?: 2 | 3 | 4 | 5;
    mantissa?: 2 | 5;
    callback: (orderBook: OrderBookData) => void;
    onError?: (error: Error) => void;
  }): () => void {
    this.currentSymbol = params.symbol;
    this.cache = null; // Clear cache for new symbol

    return this.subscribe({
      callback: (data) => {
        if (data) {
          params.callback(data);
        }
      },
    });
  }

  disconnect(): void {
    this.currentSymbol = null;
    super.disconnect();
  }
}

// ============================================================================
// Main Stream Manager
// ============================================================================

/**
 * PerpsStreamManager - Manages all stream channels
 */
export class PerpsStreamManager {
  public readonly prices = new PriceStreamChannel();
  public readonly positions = new PositionStreamChannel();
  public readonly orders = new OrderStreamChannel();
  public readonly account = new AccountStreamChannel();
  public readonly fills = new FillStreamChannel();
  public readonly marketData = new MarketDataChannel();
  public readonly oiCaps = new OICapStreamChannel();
  public readonly topOfBook = new TopOfBookStreamChannel();
  public readonly candles = new CandleStreamChannel();
  public readonly orderBook = new OrderBookStreamChannel();

  /**
   * Clear all channels (disconnect and reset)
   */
  clearAllChannels(): void {
    this.prices.disconnect();
    this.positions.disconnect();
    this.orders.disconnect();
    this.account.disconnect();
    this.fills.disconnect();
    this.marketData.disconnect();
    this.oiCaps.disconnect();
    this.topOfBook.disconnect();
    this.candles.disconnect();
    this.orderBook.disconnect();
  }

  /**
   * Prewarm all channels
   * Returns cleanup function
   */
  prewarmAll(): () => void {
    const cleanups = [
      this.prices.prewarm(),
      this.positions.prewarm(),
      this.orders.prewarm(),
      this.account.prewarm(),
      this.fills.prewarm(),
      this.marketData.prewarm(),
      this.oiCaps.prewarm(),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }
}

// Export singleton instance getter
let streamManagerInstance: PerpsStreamManager | null = null;

export function getStreamManagerInstance(): PerpsStreamManager {
  if (!streamManagerInstance) {
    streamManagerInstance = new PerpsStreamManager();
  }
  return streamManagerInstance;
}
