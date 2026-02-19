/**
 * Perps Providers - MOCK VERSION
 *
 * This module exports MOCK providers and utilities for Perps UI development.
 * Use this version to develop UI without the actual perps-controller dependency.
 *
 * To switch between mock and real:
 * - In index.ts, import from './index.mock' (mock) or use the real implementations
 *
 * Key components:
 * - `PerpsStreamManager` - Mock stream manager with static data
 * - `getPerpsController` - Mock controller implementation
 * - `PerpsControllerProvider` - Mock provider component
 * - `usePerpsController` - Mock hook for controller access
 * - Types from local type definitions
 */

// Stream Manager (mock version with static data)
export {
  getPerpsStreamManager,
  resetPerpsStreamManager,
  PerpsStreamManager,
  PerpsDataChannel,
} from './PerpsStreamManager';

// Controller access (mock version)
export {
  getPerpsController,
  resetPerpsController,
  type PerpsControllerState,
  getPerpsControllerCurrentAddress,
  isPerpsControllerInitialized,
  getPerpsControllerInstance,
} from './getPerpsController.mock';

// React Provider & Hook for controller access (mock version)
export {
  PerpsControllerProvider,
  usePerpsController,
  PerpsControllerContext,
  type PerpsControllerProviderProps,
} from './PerpsControllerProvider.mock';

// Re-export commonly used types from local type definitions
// (since we're not using @metamask/perps-controller in mock mode)
export type {
  AccountState,
  Position,
  Order,
  OrderFill,
  PerpsMarketData,
  PerpsTransaction,
} from '../../components/app/perps/types';
