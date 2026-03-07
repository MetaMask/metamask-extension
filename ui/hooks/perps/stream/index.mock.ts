/**
 * Perps Stream Hooks - MOCK VERSION
 *
 * Mock implementations of stream hooks that return static data from mocks.ts.
 * Use these during development to work on UI without the actual perps-controller dependency.
 *
 * To use these mocks, update the import in your components from:
 *
 * import { usePerpsLivePositions } from '../../../hooks/perps/stream'
 *
 * To (when using mocks):
 *
 * import { usePerpsLivePositions } from '../../../hooks/perps/stream/index.mock'
 *
 * Or better yet, update hooks/perps/stream/index.ts to export from here conditionally.
 */

import {
  CandlePeriod,
  TimeDuration,
} from '../../../components/app/perps/constants/chartConfig';
import {
  mockPositions,
  mockOrders,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';
import type {
  OrderFill,
  Position,
  Order,
  AccountState,
  PerpsMarketData,
  CandleData,
  CandleStick,
} from '@metamask/perps-controller';

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
// Fills Hook
// ============================================================================

export type UsePerpsLiveFillsOptions = {
  throttleMs?: number;
};

export type UsePerpsLiveFillsReturn = {
  fills: OrderFill[];
  isInitialLoading: boolean;
};

export function usePerpsLiveFills(
  _options: UsePerpsLiveFillsOptions = {},
): UsePerpsLiveFillsReturn {
  return {
    fills: [],
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
// Candle Hook
// ============================================================================

// Re-export types for convenience
export type {
  CandlePeriod,
  TimeDuration,
} from '../../../components/app/perps/constants/chartConfig';
export type { CandleData, CandleStick } from '@metamask/perps-controller';

export type UsePerpsLiveCandlesOptions = {
  symbol: string;
  interval: CandlePeriod;
  duration?: TimeDuration;
  throttleMs?: number;
  onError?: (error: Error) => void;
};

export type UsePerpsLiveCandlesReturn = {
  candleData: CandleData | null;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasHistoricalData: boolean;
  error: Error | null;
  fetchMoreHistory: () => void;
};

/**
 * Static mock candle data
 * Simple, reliable mock data that works for any symbol/interval
 *
 * @param symbol
 * @param interval
 */
function getMockCandleData(symbol: string, interval: CandlePeriod): CandleData {
  // Base timestamp (1 hour ago from now)
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Static set of 50 candles showing an uptrend
  const basePrice = 50000;
  const candles: CandleStick[] = [];

  for (let i = 0; i < 50; i++) {
    const time = now - (50 - i) * oneHour;
    const trend = i * 100; // Gradual uptrend
    const volatility = 200;

    const open = basePrice + trend;
    const close = open + Math.sin(i) * volatility;
    const high =
      Math.max(open, close) + Math.abs(Math.cos(i) * volatility * 0.5);
    const low =
      Math.min(open, close) - Math.abs(Math.sin(i) * volatility * 0.5);

    candles.push({
      time,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: (1000000 + i * 10000).toFixed(2),
    });
  }

  return {
    symbol,
    interval,
    candles,
  };
}

export function usePerpsLiveCandles(
  options: UsePerpsLiveCandlesOptions,
): UsePerpsLiveCandlesReturn {
  const { symbol, interval } = options;

  // Return static mock candle data
  const candleData =
    symbol && interval ? getMockCandleData(symbol, interval) : null;

  return {
    candleData,
    isInitialLoading: false,
    isLoadingMore: false,
    hasHistoricalData: candleData !== null,
    error: null,
    fetchMoreHistory: () => {
      console.log('[Mock] Fetch more candle history requested (no-op)');
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
} from '@metamask/perps-controller';
