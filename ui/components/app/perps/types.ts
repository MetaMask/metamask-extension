/* eslint-disable import/no-restricted-paths */
/**
 * Re-export types from controller (single source of truth)
 *
 * Type import paths do not need to be restricted, as they are stripped
 * at runtime and do not have any build time impact.
 *
 * This file re-exports types from the controller layer to maintain
 * backward compatibility with existing UI imports. All type definitions
 * live in app/scripts/controllers/perps/types.
 *
 * When @metamask/perps-controller is installed, the controller types
 * will re-export from the package, making this the single import point
 * for UI components.
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
} from '../../../../app/scripts/controllers/perps/types';
