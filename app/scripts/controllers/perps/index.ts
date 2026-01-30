/**
 * Perps Controller
 *
 * This module exports the MockPerpsController for UI development.
 * When the real @metamask/perps-controller is ready, update this export:
 *
 * ```typescript
 * export { PerpsController } from '@metamask/perps-controller';
 * ```
 *
 * All types, constants, and utilities are aligned with the core controller
 * to ensure a smooth migration path.
 */

// Export the mock controller (will be replaced with real controller)
export {
  MockPerpsController,
  getDefaultPerpsControllerState,
  type PerpsControllerState,
} from './MockPerpsController';

// Export all types
export * from './types';

// Export all constants
export * from './constants';

// Export all utilities
export * from './utils';

// Export mock data (useful for testing and Storybook)
export * from './mocks';
