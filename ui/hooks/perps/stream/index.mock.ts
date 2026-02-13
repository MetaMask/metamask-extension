/**
 * Perps Stream Hooks - MOCK VERSION
 *
 * Mock implementations of stream hooks that return static data from mocks.ts.
 * Use these during development to work on UI without the actual perps-controller dependency.
 *
 * To use these mocks, update the import in your components from:
 *   import { usePerpsLivePositions } from '../../../hooks/perps/stream'
 * To (when using mocks):
 *   import { usePerpsLivePositions } from '../../../hooks/perps/stream/index.mock'
 *
 * Or better yet, update hooks/perps/stream/index.ts to export from here conditionally.
 */

import type {
  Position,
  Order,
  AccountState,
  PerpsMarketData,
} from '../../../components/app/perps/types';
import {
  mockPositions,
  mockOrders,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';

// ============================================================================
// Position Hook
// ============================================================================

export type UsePerpsLivePositionsOptions = {
  throttleMs?: number;
};

export type UsePerpsLivePositionsReturn = {
  positions: Position[];
  isInitialLoading: boolean;
};

export function usePerpsLivePositions(
  _options: UsePerpsLivePositionsOptions = {},
): UsePerpsLivePositionsReturn {
  return {
    positions: mockPositions,
    isInitialLoading: false,
  };
}

// ============================================================================
// Orders Hook
// ============================================================================

export type UsePerpsLiveOrdersOptions = {
  throttleMs?: number;
};

export type UsePerpsLiveOrdersReturn = {
  orders: Order[];
  isInitialLoading: boolean;
};

export function usePerpsLiveOrders(
  _options: UsePerpsLiveOrdersOptions = {},
): UsePerpsLiveOrdersReturn {
  return {
    orders: mockOrders,
    isInitialLoading: false,
  };
}

// ============================================================================
// Account Hook
// ============================================================================

export type UsePerpsLiveAccountOptions = {
  throttleMs?: number;
};

export type UsePerpsLiveAccountReturn = {
  account: AccountState | null;
  isInitialLoading: boolean;
};

export function usePerpsLiveAccount(
  _options: UsePerpsLiveAccountOptions = {},
): UsePerpsLiveAccountReturn {
  return {
    account: mockAccountState,
    isInitialLoading: false,
  };
}

// ============================================================================
// Market Data Hook
// ============================================================================

export type UsePerpsLiveMarketDataOptions = {
  autoSubscribe?: boolean;
};

export type UsePerpsLiveMarketDataReturn = {
  markets: PerpsMarketData[];
  cryptoMarkets: PerpsMarketData[];
  hip3Markets: PerpsMarketData[];
  isInitialLoading: boolean;
  error: Error | null;
  refresh: () => void;
};

export function usePerpsLiveMarketData(
  _options: UsePerpsLiveMarketDataOptions = {},
): UsePerpsLiveMarketDataReturn {
  return {
    markets: [...mockCryptoMarkets, ...mockHip3Markets],
    cryptoMarkets: mockCryptoMarkets,
    hip3Markets: mockHip3Markets,
    isInitialLoading: false,
    error: null,
    refresh: () => {
      console.log('[Mock] Market data refresh requested (no-op)');
    },
  };
}

// ============================================================================
// Re-export types
// ============================================================================

export type {
  Position,
  Order,
  AccountState,
  PerpsMarketData,
} from '../../../components/app/perps/types';
