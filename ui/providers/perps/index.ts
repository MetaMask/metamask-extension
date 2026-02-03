/**
 * Perps Providers
 *
 * This module exports the React context provider for Perps UI.
 *
 * Usage:
 * - `usePerpsController()` - Hook to access PerpsController directly
 * - `PerpsControllerProvider` - React provider for controller context
 * - Types from `@metamask/perps-controller`
 */

// Controller access
export {
  getPerpsController,
  resetPerpsController,
  type PerpsControllerState,
} from './getPerpsController';

// React Provider & Hook for direct controller access
export {
  PerpsControllerProvider,
  usePerpsController,
  PerpsControllerContext,
  type PerpsControllerProviderProps,
} from './PerpsControllerProvider';

// Route Wrapper
export {
  PerpsRouteWrapper,
  type PerpsRouteWrapperProps,
} from './PerpsRouteWrapper';

// Re-export commonly used types from the controller package
export type {
  AccountState,
  Position,
  Order,
  OrderFill,
  PriceUpdate,
  PerpsMarketData,
  CandleData,
  OrderBookData,
  CandlePeriod,
  TimeDuration,
  WebSocketConnectionState,
  SubscribeAccountParams,
  SubscribePositionsParams,
  SubscribeOrdersParams,
  SubscribeOrderFillsParams,
  SubscribePricesParams,
  SubscribeCandlesParams,
  SubscribeOrderBookParams,
} from '@metamask/perps-controller';
