/**
 * Perps Stream Hooks
 *
 * Real-time data subscription hooks for Perps UI components.
 * These hooks use the PerpsStreamManager for cached, BehaviorSubject-like access.
 *
 * Key feature: Cached data is delivered immediately on subscribe, eliminating
 * loading skeletons when navigating between Perps views (matching mobile UX).
 *
 * Usage:
 * ```tsx
 * import { usePerpsLivePositions } from '../hooks/perps/stream';
 *
 * function PositionsList() {
 *   // No provider wrapping needed - uses module-level singleton
 *   const { positions, isInitialLoading } = usePerpsLivePositions();
 *   // ... render positions
 * }
 * ```
 */

// Stream Manager hook (base hook for all stream hooks)
export {
  usePerpsStreamManager,
  type UsePerpsStreamManagerReturn,
} from './usePerpsStreamManager';

// Price hooks
export {
  usePerpsLivePrices,
  type UsePerpsLivePricesOptions,
  type UsePerpsLivePricesReturn,
} from './usePerpsLivePrices';

// Position hooks
export {
  usePerpsLivePositions,
  type UsePerpsLivePositionsOptions,
  type UsePerpsLivePositionsReturn,
} from './usePerpsLivePositions';

// Order hooks
export {
  usePerpsLiveOrders,
  type UsePerpsLiveOrdersOptions,
  type UsePerpsLiveOrdersReturn,
} from './usePerpsLiveOrders';

// Account hooks
export {
  usePerpsLiveAccount,
  type UsePerpsLiveAccountOptions,
  type UsePerpsLiveAccountReturn,
} from './usePerpsLiveAccount';

// Fill hooks
export {
  usePerpsLiveFills,
  type UsePerpsLiveFillsOptions,
  type UsePerpsLiveFillsReturn,
} from './usePerpsLiveFills';

// Candle hooks
export {
  usePerpsLiveCandles,
  type UsePerpsLiveCandlesOptions,
  type UsePerpsLiveCandlesReturn,
} from './usePerpsLiveCandles';

// Order book hooks
export {
  usePerpsLiveOrderBook,
  type UsePerpsLiveOrderBookOptions,
  type UsePerpsLiveOrderBookReturn,
} from './usePerpsLiveOrderBook';

// Top of book hooks
export {
  usePerpsTopOfBook,
  type UsePerpsTopOfBookOptions,
  type UsePerpsTopOfBookReturn,
  type TopOfBookData,
} from './usePerpsTopOfBook';

// Market data hooks
export {
  usePerpsLiveMarketData,
  type UsePerpsLiveMarketDataOptions,
  type UsePerpsLiveMarketDataReturn,
} from './usePerpsLiveMarketData';

// Re-export types from @metamask/perps-controller for convenience
export type {
  PriceUpdate,
  Position,
  Order,
  OrderFill,
  AccountState,
  CandleData,
  OrderBookData,
  CandlePeriod,
  TimeDuration,
  PerpsMarketData,
} from '@metamask/perps-controller';
