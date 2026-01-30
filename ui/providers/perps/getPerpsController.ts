import {
  MockPerpsController,
  type PerpsControllerState,
} from '../../../app/scripts/controllers/perps';

/**
 * Singleton instance of the PerpsController
 * Initially uses MockPerpsController for development
 *
 * When the real @metamask/perps-controller is integrated:
 * 1. Update this file to return the real controller from Engine.context
 * 2. No changes needed to stream manager or hooks
 */
let controllerInstance: MockPerpsController | null = null;

/**
 * Get the PerpsController instance
 * Returns a singleton MockPerpsController that is initialized on first access
 *
 * @returns The PerpsController instance
 */
export function getPerpsController(): MockPerpsController {
  if (!controllerInstance) {
    controllerInstance = new MockPerpsController();
    // Initialize the controller
    controllerInstance.init();
  }
  return controllerInstance;
}

/**
 * Reset the controller instance (useful for testing)
 */
export function resetPerpsController(): void {
  if (controllerInstance) {
    controllerInstance.disconnect();
    controllerInstance = null;
  }
}

// Re-export types for convenience
export type { PerpsControllerState };
