/**
 * Perps Providers
 *
 * This module exports providers and utilities for Perps UI.
 *
 * Key components:
 * - `PerpsStreamManager` - Module-level singleton for cached data streams
 * - Types from `@metamask/perps-controller`
 *
 * The PerpsStreamManager provides:
 * - Cached data channels for positions, orders, account, fills, markets
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

// Legacy mock provider + controller (kept for PR 4/5 migration)
export { getPerpsController } from './getPerpsController.mock';
export {
  PerpsControllerProvider,
  usePerpsController,
} from './PerpsControllerProvider.mock';

// Data Channel (building block for stream manager)
export { PerpsDataChannel } from './PerpsDataChannel';

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
