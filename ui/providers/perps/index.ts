/**
 * Perps Providers
 *
 * This module exports providers and utilities for Perps UI.
 *
 * Key components:
 * - `PerpsStreamManager` - Module-level singleton for cached data streams
 * - `PerpsControllerProvider` - React provider for direct controller access (legacy)
 * - Types from `@metamask/perps-controller`
 *
 * The PerpsStreamManager provides:
 * - Cached data channels for positions, orders, account, markets
 * - BehaviorSubject-like subscription (immediate callback with cached data)
 * - Prewarm functionality to keep cache fresh
 * - Account-aware initialization (reinitializes on account switch)
 */

// Stream Manager (preferred - provides caching for smooth navigation)
export {
  getPerpsStreamManager,
  resetPerpsStreamManager,
  PerpsStreamManager,
} from './PerpsStreamManager';

// Data Channel (building block for stream manager)
export { PerpsDataChannel } from './PerpsDataChannel';

// Controller access (lower-level)
export {
  getPerpsController,
  resetPerpsController,
  type PerpsControllerState,
} from './getPerpsController';

// React Provider & Hook for direct controller access (legacy - prefer stream hooks)
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
