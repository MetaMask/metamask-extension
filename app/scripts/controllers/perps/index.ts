/**
 * Perps Controller
 *
 * This module exports the real PerpsController from @metamask/perps-controller.
 *
 * The controller provides:
 * - Real-time balance/position streaming via WebSocket
 * - HTTP methods for fetching account state, positions, orders
 * - Trading operations (place order, close position, etc.)
 */

// Export the real controller and state types
export {
  PerpsController,
  getDefaultPerpsControllerState,
  type PerpsControllerState,
  type PerpsControllerOptions,
  type PerpsControllerMessenger,
  type PerpsControllerActions,
  type PerpsControllerEvents,
  InitializationState,
} from '@metamask/perps-controller';

// Export all types from the package
export type {
  AccountState,
  Position,
  Order,
  OrderFill,
  PriceUpdate,
  PerpsMarketData,
  MarketInfo,
  CandleData,
  OrderBookData,
  OrderBookLevel,
  Funding,
  // Subscription params
  SubscribeAccountParams,
  SubscribePositionsParams,
  SubscribeOrdersParams,
  SubscribeOrderFillsParams,
  SubscribePricesParams,
  SubscribeCandlesParams,
  SubscribeOrderBookParams,
  SubscribeOICapsParams,
  // Action params
  OrderParams,
  OrderResult,
  ClosePositionParams,
  WithdrawParams,
  WithdrawResult,
  CancelOrderParams,
  CancelOrderResult,
  GetAccountStateParams,
  GetPositionsParams,
  GetOrdersParams,
  GetOrderFillsParams,
  // Other types
  WebSocketConnectionState,
  CandlePeriod,
  TimeDuration,
  PerpsPlatformDependencies,
  PerpsProviderType,
  PerpsActiveProviderMode,
} from '@metamask/perps-controller';

// Export infrastructure for creating the controller
export { createPerpsInfrastructure } from './infrastructure';

// Export local constants (market configs, etc.)
export * from './constants';

// Export local utilities
export * from './utils';

// Keep mock exports for testing and Storybook
export * from './mocks';

// Keep MockPerpsController for fallback/testing
export { MockPerpsController } from './MockPerpsController';
