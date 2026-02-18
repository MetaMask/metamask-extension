/**
 * PerpsStreamManager
 *
 * Currently using mock implementation for development.
 * This file will be updated to use real stream manager when integration is complete.
 */

// Re-export everything from the mock implementation
// export * from './index.mock';

// Re-exports the real PerpsStreamManager (uses @metamask/perps-controller and getPerpsController).

export {
  getPerpsStreamManager,
  resetPerpsStreamManager,
  PerpsStreamManager,
} from '../PerpsStreamManager';
