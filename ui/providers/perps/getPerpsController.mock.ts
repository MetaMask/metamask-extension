/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { mockPositions } from '../../components/app/perps/mocks';
import type { OrderParams } from '@metamask/perps-controller';
import {
  AccountState,
  Order,
  OrderFill,
  PerpsMarketData,
  Position,
} from '@metamask/perps-controller';

/**
 * Mock PerpsController class
 * Implements the subset of PerpsController methods used by the UI
 */
class MockPerpsController {
  private selectedAddress: string;

  // Mock messenger for state change subscriptions
  public messenger = {
    subscribe: (event: string) => {
      console.log(`[MockPerpsController] Subscribed to event: ${event}`);
      // Return unsubscribe function
      return () => {
        console.log(`[MockPerpsController] Unsubscribed from event: ${event}`);
      };
    },
  };

  constructor(selectedAddress: string) {
    this.selectedAddress = selectedAddress;
  }

  /**
   * Cancel a single order
   *
   * @param options0
   * @param options0.orderId
   * @param options0.symbol
   */
  async cancelOrder({
    orderId,
    symbol,
  }: {
    orderId: string;
    symbol: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    console.log(
      `[MockPerpsController] Canceling order ${orderId} for ${symbol}`,
    );
    // In a real implementation, this would call the API
    // For now, we just log it
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { success: true };
  }

  /**
   * Cancel multiple orders or all orders
   *
   * @param options0
   * @param options0.cancelAll
   */
  async cancelOrders({ cancelAll }: { cancelAll: boolean }): Promise<void> {
    console.log(`[MockPerpsController] Canceling all orders: ${cancelAll}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Subscribe to positions updates
   * Returns an unsubscribe function
   *
   * @param options0
   * @param options0.callback
   */
  subscribeToPositions({
    callback,
  }: {
    callback: (positions: Position[]) => void;
  }) {
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
   *
   * @param options0
   * @param options0.callback
   */
  subscribeToOrders({ callback }: { callback: (orders: Order[]) => void }) {
    console.log('[MockPerpsController] Subscribed to orders');
    return () => {
      console.log('[MockPerpsController] Unsubscribed from orders');
    };
  }

  /**
   * Subscribe to order fill updates
   * Returns an unsubscribe function
   *
   * @param options0
   * @param options0.callback
   */
  subscribeToOrderFills({
    callback,
  }: {
    callback: (fills: OrderFill[], isSnapshot?: boolean) => void;
  }) {
    console.log('[MockPerpsController] Subscribed to order fills');
    return () => {
      console.log('[MockPerpsController] Unsubscribed from order fills');
    };
  }

  /**
   * Subscribe to account updates
   * Returns an unsubscribe function
   *
   * @param options0
   * @param options0.callback
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToAccount({
    callback,
  }: {
    callback: (account: AccountState) => void;
  }) {
    console.log('[MockPerpsController] Subscribed to account');
    return () => {
      console.log('[MockPerpsController] Unsubscribed from account');
    };
  }

  /**
   * Subscribe to price updates
   * Returns an unsubscribe function
   *
   * @param options0
   * @param options0.symbols
   * @param options0.includeMarketData
   * @param options0.callback
   * @param options0.throttleMs
   */
  subscribeToPrices({
    symbols,
    includeMarketData,
    callback,
    throttleMs,
  }: {
    symbols: string[];
    includeMarketData?: boolean;
    callback: (prices: PerpsMarketData[]) => void;
    throttleMs?: number;
  }) {
    console.log(
      `[MockPerpsController] Subscribed to prices for ${symbols.join(', ')}`,
      { includeMarketData, throttleMs },
    );
    return () => {
      console.log(
        `[MockPerpsController] Unsubscribed from prices for ${symbols.join(', ')}`,
      );
    };
  }

  /**
   * Subscribe to order book updates
   * Returns an unsubscribe function
   *
   * @param options0
   * @param options0.symbol
   * @param options0.levels
   * @param options0.callback
   * @param options0.throttleMs
   * @param options0.nSigFigs
   * @param options0.mantissa
   */
  subscribeToOrderBook({
    symbol,
    levels,
    nSigFigs,
    mantissa,
    callback,
    throttleMs,
  }: {
    symbol: string;
    levels: number;
    nSigFigs: any;
    mantissa: any;
    callback: (orderBook: any) => void;
    throttleMs?: number;
  }) {
    console.log(
      `[MockPerpsController] Subscribed to order book for ${symbol}`,
      { levels, nSigFigs, mantissa, throttleMs },
    );
    return () => {
      console.log(
        `[MockPerpsController] Unsubscribed from order book for ${symbol}`,
      );
    };
  }

  /**
   * Place a new order
   *
   * @param params - OrderParams from PerpsController (symbol, isBuy, size, orderType, etc.)
   */
  async placeOrder(
    params: OrderParams,
  ): Promise<
    { success: true; orderId: string } | { success: false; error: string }
  > {
    console.log('[MockPerpsController] Placing order:', params);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      success: true,
      orderId: `mock-order-${Date.now()}`,
    };
  }

  /**
   * Close a position
   *
   * @param params
   * @param params.symbol
   * @param params.orderType
   * @param params.price
   */
  async closePosition(params: {
    symbol: string;
    orderType?: 'market' | 'limit';
    price?: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    console.log('[MockPerpsController] Closing position:', params);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { success: true };
  }

  /**
   * Update position margin (add or remove)
   *
   * @param params
   * @param params.symbol - Asset symbol
   * @param params.amount - Amount to add (positive) or remove (negative)
   */
  async updateMargin(params: {
    symbol: string;
    amount: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    console.log('[MockPerpsController] Updating margin:', params);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock success response
    return { success: true };
  }

  /**
   * Update position TP/SL (take profit / stop loss)
   *
   * @param params
   * @param params.symbol
   * @param params.takeProfitPrice
   * @param params.stopLossPrice
   */
  async updatePositionTPSL(params: {
    symbol: string;
    takeProfitPrice?: string;
    stopLossPrice?: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    console.log('[MockPerpsController] Updating TP/SL:', params);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { success: true };
  }

  /**
   * Get all positions
   * Returns mock positions from mocks.ts
   *
   * @param params
   * @param params.skipCache
   */
  async getPositions({
    skipCache,
  }: {
    skipCache?: boolean;
  }): Promise<Position[]> {
    console.log('[MockPerpsController] Getting positions');
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockPositions;
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
   * Get active provider (for transaction history and user data fetching)
   */
  getActiveProvider() {
    return {
      async getOrderFills(_params: any) {
        console.log('[MockPerpsController] Getting order fills');
        // Return empty array - real implementation would fetch from API
        return [];
      },
      async getOrders(_params: any): Promise<Order[]> {
        console.log('[MockPerpsController] Getting orders');
        // Return empty array - real implementation would fetch from API
        return [];
      },
      async getFunding(_params: any) {
        console.log('[MockPerpsController] Getting funding');
        // Return empty array - real implementation would fetch from API
        return [];
      },
      async getUserHistory(_params: any) {
        console.log('[MockPerpsController] Getting user history');
        // Return empty array - real implementation would fetch from API
        return [];
      },
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
 *
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
