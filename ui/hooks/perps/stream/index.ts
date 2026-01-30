/**
 * Perps Stream Hooks
 *
 * Real-time data subscription hooks for Perps UI components.
 * These hooks use the PerpsStreamManager via React context.
 *
 * Usage:
 * 1. Wrap your component tree with <PerpsStreamProvider>
 * 2. Use these hooks in child components
 *
 * @example
 * ```tsx
 * import { PerpsStreamProvider } from '../providers/perps';
 * import { usePerpsLivePositions } from '../hooks/perps/stream';
 *
 * function App() {
 *   return (
 *     <PerpsStreamProvider>
 *       <PositionsList />
 *     </PerpsStreamProvider>
 *   );
 * }
 *
 * function PositionsList() {
 *   const { positions, isInitialLoading } = usePerpsLivePositions();
 *   // ... render positions
 * }
 * ```
 */

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

// Re-export types from controller for convenience
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
} from '../../../../app/scripts/controllers/perps/types';
