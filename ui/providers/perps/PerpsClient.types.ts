/* eslint-disable import/no-restricted-paths */
/**
 * PerpsClient Type Definitions
 *
 * This file defines the PerpsClient interface - the main abstraction layer
 * between UI code and the perps controller implementation.
 *
 * Benefits:
 * - Single swap point when integrating real @metamask/perps-controller
 * - UI code depends on stable interface, not implementation details
 * - Easy to mock for testing
 */

import type {
  Position,
  Order,
  OrderFill,
  AccountState,
  PriceUpdate,
  PerpsMarketData,
  CandleData,
  OrderBookData,
  OrderParams,
  OrderResult,
  ClosePositionParams,
  CancelOrderParams,
  CancelOrderResult,
  WithdrawParams,
  WithdrawResult,
  GetMarketsParams,
  MarketInfo,
  CandlePeriod,
  TimeDuration,
  WebSocketConnectionState,
} from '../../../app/scripts/controllers/perps/types';

// Re-export commonly used types for consumers
export type {
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
};

// ============================================================================
// Stream Subscription Types
// ============================================================================

/**
 * Parameters for price subscription
 * Matches real controller's SubscribePricesParams
 */
export type PricesSubscribeParams = {
  symbols: string[];
  callback: (prices: PriceUpdate[]) => void;
  throttleMs?: number;
  includeOrderBook?: boolean;
  includeMarketData?: boolean;
};

/**
 * Parameters for position subscription
 * Matches real controller's SubscribePositionsParams
 */
export type PositionsSubscribeParams = {
  callback: (positions: Position[]) => void;
  accountId?: string;
  includeHistory?: boolean;
};

/**
 * Parameters for order subscription
 * Matches real controller's SubscribeOrdersParams
 */
export type OrdersSubscribeParams = {
  callback: (orders: Order[]) => void;
  accountId?: string;
  includeHistory?: boolean;
};

/**
 * Parameters for account subscription
 * Matches real controller's SubscribeAccountParams
 */
export type AccountSubscribeParams = {
  callback: (account: AccountState) => void;
  accountId?: string;
};

/**
 * Parameters for order fills subscription
 * Matches real controller's SubscribeOrderFillsParams
 */
export type OrderFillsSubscribeParams = {
  callback: (fills: OrderFill[], isSnapshot?: boolean) => void;
  accountId?: string;
  since?: number;
};

/**
 * Parameters for order book subscription
 * Matches real controller's SubscribeOrderBookParams
 */
export type OrderBookSubscribeParams = {
  symbol: string;
  levels?: number;
  nSigFigs?: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
  callback: (orderBook: OrderBookData) => void;
  onError?: (error: Error) => void;
};

/**
 * Parameters for candles subscription
 * Matches real controller's SubscribeCandlesParams
 */
export type CandlesSubscribeParams = {
  symbol: string;
  interval: CandlePeriod;
  duration?: TimeDuration;
  callback: (data: CandleData) => void;
  onError?: (error: Error) => void;
};

/**
 * Parameters for market data subscription
 */
export type MarketDataSubscribeParams = {
  callback: (markets: PerpsMarketData[]) => void;
};

/**
 * Parameters for OI caps subscription
 * Matches real controller's SubscribeOICapsParams
 */
export type OICapsSubscribeParams = {
  callback: (caps: string[]) => void;
  accountId?: string;
};

// ============================================================================
// Client Interface Sections
// ============================================================================

/**
 * Stream subscription interface
 * Provides subscribe methods for real-time data
 */
export interface PerpsClientStreams {
  /**
   * Subscribe to real-time price updates
   */
  prices: {
    subscribe(params: PricesSubscribeParams): () => void;
  };

  /**
   * Subscribe to real-time position updates
   */
  positions: {
    subscribe(params: PositionsSubscribeParams): () => void;
  };

  /**
   * Subscribe to real-time order updates
   */
  orders: {
    subscribe(params: OrdersSubscribeParams): () => void;
  };

  /**
   * Subscribe to real-time account state updates
   */
  account: {
    subscribe(params: AccountSubscribeParams): () => void;
  };

  /**
   * Subscribe to order fill updates
   */
  orderFills: {
    subscribe(params: OrderFillsSubscribeParams): () => void;
  };

  /**
   * Subscribe to order book updates
   */
  orderBook: {
    subscribe(params: OrderBookSubscribeParams): () => void;
  };

  /**
   * Subscribe to candlestick data updates
   */
  candles: {
    subscribe(params: CandlesSubscribeParams): () => void;
  };

  /**
   * Subscribe to market data updates
   */
  marketData: {
    subscribe(params: MarketDataSubscribeParams): () => void;
  };

  /**
   * Subscribe to open interest cap updates
   */
  oiCaps: {
    subscribe(params: OICapsSubscribeParams): () => void;
  };
}

/**
 * Actions interface
 * Provides methods for trading operations (request/response)
 */
export interface PerpsClientActions {
  /**
   * Place a new order
   */
  placeOrder(params: OrderParams): Promise<OrderResult>;

  /**
   * Close a position (partial or full)
   */
  closePosition(params: ClosePositionParams): Promise<OrderResult>;

  /**
   * Cancel an existing order
   */
  cancelOrder(params: CancelOrderParams): Promise<CancelOrderResult>;

  /**
   * Withdraw funds from trading account
   */
  withdraw(params: WithdrawParams): Promise<WithdrawResult>;

  /**
   * Get available markets
   */
  getMarkets(params?: GetMarketsParams): Promise<MarketInfo[]>;

  /**
   * Get current positions
   */
  getPositions(): Promise<Position[]>;

  /**
   * Get current orders
   */
  getOrders(): Promise<Order[]>;

  /**
   * Get account state
   */
  getAccountState(): Promise<AccountState>;
}

/**
 * Connection management interface
 * Provides methods for monitoring and managing WebSocket connection
 */
export interface PerpsClientConnection {
  /**
   * Get current WebSocket connection state
   */
  getState(): WebSocketConnectionState;

  /**
   * Subscribe to connection state changes
   * @param listener - Called with state and reconnection attempt number
   * @returns Unsubscribe function
   */
  subscribe(
    listener: (state: WebSocketConnectionState, reconnectionAttempt: number) => void,
  ): () => void;

  /**
   * Manually trigger reconnection
   */
  reconnect(): Promise<void>;
}

// ============================================================================
// Main Client Interface
// ============================================================================

/**
 * PerpsClient - Main abstraction for UI to interact with perps functionality
 *
 * This interface allows swapping between:
 * - MockPerpsClient (development/testing)
 * - ControllerPerpsClient (production with real @metamask/perps-controller)
 *
 * Usage:
 * ```tsx
 * const client = usePerpsClient();
 *
 * // Subscribe to streams
 * client.streams.positions.subscribe({ callback: (pos) => console.log(pos) });
 *
 * // Execute actions
 * await client.actions.placeOrder({ ... });
 *
 * // Monitor connection
 * client.connection.subscribe((state) => console.log(state));
 * ```
 */
export interface PerpsClient {
  /**
   * Real-time data streams
   * Use for subscribing to live updates (positions, orders, prices, etc.)
   */
  streams: PerpsClientStreams;

  /**
   * Trading actions
   * Use for request/response operations (place order, close position, etc.)
   */
  actions: PerpsClientActions;

  /**
   * Connection management
   * Use for monitoring WebSocket health and triggering reconnection
   */
  connection: PerpsClientConnection;
}
