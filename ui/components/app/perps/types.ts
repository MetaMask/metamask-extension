/**
 * Perps UI Types
 *
 * Re-exports types from @metamask/perps-controller for use in UI components.
 * This provides a single import point and maintains backward compatibility.
 */

export type {
  // Core trading types
  Position,
  Order,
  OrderType,
  AccountState,

  // Market types
  PerpsMarketData,
  MarketType,
  MarketInfo,

  // Order-related types
  OrderParams,
  OrderResult,
  OrderFill,
  ClosePositionParams,
  CancelOrderParams,
  CancelOrderResult,

  // Margin adjustment types
  UpdateMarginParams,
  MarginResult,

  // Price and market data
  PriceUpdate,

  // Subscription params (for hooks)
  SubscribePricesParams,
  SubscribePositionsParams,
  SubscribeOrdersParams,
  SubscribeAccountParams,
  SubscribeOrderFillsParams,
  SubscribeOrderBookParams,
  SubscribeCandlesParams,

  // Order book types
  OrderBookData,
  OrderBookLevel,

  // Candle types
  CandleData,
  CandlePeriod,
  TimeDuration,

  // Transaction history types from controller
  Funding,
  UserHistoryItem,
} from '@metamask/perps-controller';

// Re-export transaction history types for UI
export type {
  PerpsTransaction,
  PerpsTransactionFilter,
  TransactionSection,
} from './types/transactionHistory';

export {
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
  FillType,
} from './types/transactionHistory';
