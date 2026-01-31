/**
 * Perps Providers
 *
 * This module exports the React context provider and utilities for Perps UI.
 *
 * Preferred imports for new code:
 * - `usePerpsClient()` - Hook to access PerpsClient in React components
 * - `PerpsClient` type - Interface for perps functionality
 * - `createMockPerpsClient()` - Factory for mock client
 *
 * Legacy/deprecated exports:
 * - `PerpsStreamManager` - Use `createMockPerpsClient()`
 * - `getStreamManagerInstance` - Use `createMockPerpsClient()`
 * - `usePerpsStream` - Use `usePerpsClient()`
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

// React Provider & Client
export {
  PerpsStreamProvider,
  usePerpsClient,
  PerpsClientContext,
  type PerpsStreamProviderProps,
  type PerpsClient,
} from './PerpsStreamProvider';

// Route Wrapper
export {
  PerpsRouteWrapper,
  type PerpsRouteWrapperProps,
} from './PerpsRouteWrapper';

// Client factory
export { createMockPerpsClient } from './MockPerpsClient';

// Client types (for consumers who need type-only imports)
export type {
  PerpsClientStreams,
  PerpsClientActions,
  PerpsClientConnection,
  // Subscription param types
  PricesSubscribeParams,
  PositionsSubscribeParams,
  OrdersSubscribeParams,
  AccountSubscribeParams,
  OrderFillsSubscribeParams,
  OrderBookSubscribeParams,
  CandlesSubscribeParams,
  MarketDataSubscribeParams,
  OICapsSubscribeParams,
  // Re-exported data types
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
} from './PerpsClient.types';

// ============================================================================
// DEPRECATED EXPORTS - Keep for backward compatibility
// ============================================================================

/**
 * @deprecated Use `createMockPerpsClient()` instead.
 */
export {
  PerpsStreamManager,
  getStreamManagerInstance,
  type StreamSubscriptionParams,
  type TopOfBookData,
} from './PerpsStreamManager';

/**
 * @deprecated Use `usePerpsClient()` instead.
 */
export { usePerpsStream } from './PerpsStreamProvider';

/**
 * @deprecated Use `PerpsClientContext` instead.
 */
export { PerpsClientContext as PerpsStreamContext } from './PerpsStreamProvider';
