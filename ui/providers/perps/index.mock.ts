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
 * - Types from local type definitions
 */

// Stream Manager (mock version with static data)
export {
  getPerpsStreamManager,
  resetPerpsStreamManager,
  PerpsStreamManager,
} from './PerpsStreamManager.mock';

// Controller access (mock version)
export {
  getPerpsController,
  resetPerpsController,
  type PerpsControllerState,
  getPerpsControllerCurrentAddress,
  isPerpsControllerInitialized,
  getPerpsControllerInstance,
} from './getPerpsController.mock';

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

// Note: The following are not available in mock mode:
// - PerpsControllerProvider (not needed with mock)
// - PerpsRouteWrapper (not needed with mock)
// - Real-time subscription types (not needed with mock)
