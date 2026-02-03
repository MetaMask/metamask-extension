/**
 * Perps Providers
 *
 * This module exports the React context provider for Perps UI.
 *
 * Preferred imports for new code:
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

// ============================================================================
// PREFERRED EXPORTS - Use these for new code
// ============================================================================

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

// ============================================================================
// DEPRECATED EXPORTS - Keep for backward compatibility during migration
// ============================================================================

/**
 * @deprecated Use `PerpsControllerProvider` and `usePerpsController()` instead.
 */
export {
  PerpsStreamProvider,
  usePerpsClient,
  PerpsClientContext,
  usePerpsStream,
  type PerpsStreamProviderProps,
} from './PerpsStreamProvider';

/**
 * @deprecated Use direct controller access instead.
 */
export { createMockPerpsClient } from './MockPerpsClient';

/**
 * @deprecated Use direct controller access instead.
 */
export type { PerpsClient } from './PerpsClient.types';

/**
 * @deprecated Use `PerpsStreamManager` from PerpsStreamManager.ts instead.
 */
export {
  PerpsStreamManager,
  getStreamManagerInstance,
  type StreamSubscriptionParams,
  type TopOfBookData,
} from './PerpsStreamManager';
