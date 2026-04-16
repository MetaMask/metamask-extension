/**
 * Perps Providers - MOCK VERSION
 *
 * This module exports MOCK providers and utilities for Perps UI development.
 * Use this version to develop UI without the actual perps-controller dependency.
 *
 * Key components:
 * - `PerpsStreamManager` - Mock stream manager with static data
 * - Types from local type definitions
 */

// Stream Manager (mock version with static data)
export {
  getPerpsStreamManager,
  resetPerpsStreamManager,
  PerpsStreamManager,
} from './PerpsStreamManager';

export { PerpsDataChannel } from './PerpsDataChannel';

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
