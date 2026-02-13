/**
 * Mock implementation of PerpsController for UI development
 *
 * This mock provides the same API as the real PerpsController but returns
 * static mock data. Use this during development to work on UI without
 * the actual perps-controller dependency.
 *
 * To swap between mock and real:
 * - Mock: Import from './getPerpsController.mock'
 * - Real: Import from './getPerpsController'
 */

import type { Store } from 'redux';
import type { MetaMaskReduxState } from '../../store/store';

/**
 * Mock PerpsController class
 * Implements the subset of PerpsController methods used by the UI
 */
class MockPerpsController {
  private selectedAddress: string;

  constructor(selectedAddress: string) {
    this.selectedAddress = selectedAddress;
  }

  /**
   * Cancel a single order
   */
  async cancelOrder({
    orderId,
    symbol,
  }: {
    orderId: string;
    symbol: string;
  }): Promise<void> {
    console.log(
      `[MockPerpsController] Canceling order ${orderId} for ${symbol}`,
    );
    // In a real implementation, this would call the API
    // For now, we just log it
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Cancel multiple orders or all orders
   */
  async cancelOrders({
    cancelAll,
  }: {
    cancelAll: boolean;
  }): Promise<void> {
    console.log(`[MockPerpsController] Canceling all orders: ${cancelAll}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Subscribe to positions updates
   * Returns an unsubscribe function
   */
  subscribeToPositions({ callback }: { callback: (positions: any[]) => void }) {
    // In the mock, we don't actually subscribe to anything
    // The stream manager will handle providing mock data
    console.log('[MockPerpsController] Subscribed to positions');

    // Return a no-op unsubscribe function
    return () => {
      console.log('[MockPerpsController] Unsubscribed from positions');
    };
  }

  /**
   * Subscribe to orders updates
   * Returns an unsubscribe function
   */
  subscribeToOrders({ callback }: { callback: (orders: any[]) => void }) {
    console.log('[MockPerpsController] Subscribed to orders');
    return () => {
      console.log('[MockPerpsController] Unsubscribed from orders');
    };
  }

  /**
   * Subscribe to account updates
   * Returns an unsubscribe function
   */
  subscribeToAccount({ callback }: { callback: (account: any) => void }) {
    console.log('[MockPerpsController] Subscribed to account');
    return () => {
      console.log('[MockPerpsController] Unsubscribed from account');
    };
  }

  /**
   * Get active provider (for market data fetching)
   */
  getActiveProviderOrNull() {
    return {
      async getMarketDataWithPrices() {
        // Return empty array - the mock stream manager will provide data
        return [];
      },
    };
  }

  /**
   * Initialize the controller
   */
  async init(): Promise<void> {
    console.log(
      `[MockPerpsController] Initialized for address ${this.selectedAddress}`,
    );
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    console.log('[MockPerpsController] Disconnected');
  }
}

/**
 * Singleton instance of the mock controller
 */
let mockControllerInstance: MockPerpsController | null = null;

/**
 * The address the current mock controller instance was initialized with
 */
let currentAddress: string | null = null;

/**
 * Promise to track initialization to prevent race conditions
 */
let initPromise: Promise<MockPerpsController> | null = null;

/**
 * Get the mock PerpsController instance.
 * Returns a singleton mock controller that is initialized on first access.
 *
 * @param selectedAddress - The currently selected account address
 * @param _store - Redux store (unused in mock, but kept for API compatibility)
 * @returns Promise resolving to the mock PerpsController instance
 */
export async function getPerpsController(
  selectedAddress: string,
  _store?: Store<MetaMaskReduxState>,
): Promise<MockPerpsController> {
  if (!selectedAddress) {
    throw new Error(
      'No account selected. Please select an account before using Perps.',
    );
  }

  // Check if we need to reinitialize due to account switch
  const addressChanged =
    currentAddress !== null && currentAddress !== selectedAddress;

  if (addressChanged && mockControllerInstance) {
    await mockControllerInstance.disconnect();
    mockControllerInstance = null;
    initPromise = null;
  }

  // Return existing controller if address hasn't changed
  if (mockControllerInstance && currentAddress === selectedAddress) {
    return mockControllerInstance;
  }

  // Prevent race conditions during initialization
  if (!initPromise) {
    initPromise = (async () => {
      const controller = new MockPerpsController(selectedAddress);
      await controller.init();

      mockControllerInstance = controller;
      currentAddress = selectedAddress;
      return controller;
    })();
  }

  return initPromise;
}

/**
 * Reset the mock controller instance (useful for testing or account switch).
 */
export async function resetPerpsController(): Promise<void> {
  if (mockControllerInstance) {
    await mockControllerInstance.disconnect();
    mockControllerInstance = null;
    initPromise = null;
    currentAddress = null;
  }
}

/**
 * Get the current address the mock controller is initialized for.
 * Returns null if no controller is initialized.
 */
export function getPerpsControllerCurrentAddress(): string | null {
  return currentAddress;
}

/**
 * Check if the mock controller is initialized for a specific address.
 * @param address - Optional address to check. If not provided, returns true if any controller is initialized.
 */
export function isPerpsControllerInitialized(address?: string): boolean {
  if (address) {
    return mockControllerInstance !== null && currentAddress === address;
  }
  return mockControllerInstance !== null;
}

/**
 * Get the current mock controller instance without initializing it.
 * Returns null if no controller is initialized.
 */
export function getPerpsControllerInstance(): MockPerpsController | null {
  return mockControllerInstance;
}

// Mock PerpsControllerState type
export type PerpsControllerState = {
  // Add state fields as needed
};
