import { useCallback, useEffect, useState } from 'react';
import type { PerpsMarketData } from '../../components/app/perps/types';
import { PERPS_CONSTANTS } from '../../components/app/perps/constants';
import {
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../components/app/perps/mocks';

type PerpsMarketDataWithVolumeNumber = PerpsMarketData & {
  volumeNumber: number;
};

export interface UsePerpsMarketsResult {
  /**
   * Transformed market data ready for UI consumption
   */
  markets: PerpsMarketDataWithVolumeNumber[];
  /**
   * Loading state for initial data fetch
   */
  isLoading: boolean;
  /**
   * Error state with error message
   */
  error: string | null;
  /**
   * Refresh function to manually refetch data
   */
  refresh: () => Promise<void>;
  /**
   * Indicates if data is being refreshed
   */
  isRefreshing: boolean;
}

export interface UsePerpsMarketsOptions {
  /**
   * Enable automatic polling for live updates
   * @default false
   */
  enablePolling?: boolean;
  /**
   * Polling interval in milliseconds
   * @default 60000 (1 minute)
   */
  pollingInterval?: number;
  /**
   * Skip initial data fetch on mount
   * @default false
   */
  skipInitialFetch?: boolean;
  /**
   * Show markets with zero or invalid volume
   * @default false
   */
  showZeroVolume?: boolean;
}

const multipliers: Record<string, number> = {
  K: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
} as const;

// Pre-compiled regex for better performance
const VOLUME_SUFFIX_REGEX = /\$?([\d.,]+)([KMBT])?/;

// Helper function to remove commas
const removeCommas = (str: string): string => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char !== ',') result += char;
  }
  return result;
};

/**
 * Parse volume strings with magnitude suffixes (e.g., '$1.2B', '$850M')
 * Returns numeric value for sorting
 */
export const parseVolume = (volumeStr: string | undefined): number => {
  if (!volumeStr) return -1;

  // Handle special cases
  if (volumeStr === PERPS_CONSTANTS.FALLBACK_PRICE_DISPLAY) return -1;
  if (volumeStr === '$<1') return 0.5;

  // Handle suffixed values (e.g., "$1.5M", "$2.3B", "$500K")
  const suffixMatch = VOLUME_SUFFIX_REGEX.exec(volumeStr);
  if (suffixMatch) {
    const [, numberPart, suffix] = suffixMatch;
    const baseValue = Number.parseFloat(removeCommas(numberPart));

    if (Number.isNaN(baseValue)) return -1;

    return suffix ? baseValue * multipliers[suffix] : baseValue;
  }

  return -1;
};

/**
 * Custom hook to fetch and manage Perps market data
 *
 * Currently uses mock data while the WebSocket/API infrastructure is being built.
 * TODO: Replace with real data source (WebSocket or REST API)
 */
export const usePerpsMarkets = (
  options: UsePerpsMarketsOptions = {},
): UsePerpsMarketsResult => {
  const {
    skipInitialFetch = false,
    showZeroVolume = false,
  } = options;

  const [markets, setMarkets] = useState<PerpsMarketDataWithVolumeNumber[]>([]);
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to filter and sort markets by volume
  const processMarkets = useCallback(
    (marketData: PerpsMarketData[]): PerpsMarketDataWithVolumeNumber[] => {
      // Filter out invalid volume (unless showZeroVolume is true)
      const filteredData = !showZeroVolume
        ? marketData.filter((market) => {
            // Filter out fallback/error values
            if (
              market.volume === PERPS_CONSTANTS.FALLBACK_PRICE_DISPLAY ||
              market.volume === PERPS_CONSTANTS.FALLBACK_DATA_DISPLAY
            ) {
              return false;
            }
            // Filter out zero and missing values
            if (
              !market.volume ||
              market.volume === PERPS_CONSTANTS.ZERO_AMOUNT_DISPLAY ||
              market.volume === PERPS_CONSTANTS.ZERO_AMOUNT_DETAILED_DISPLAY
            ) {
              return false;
            }
            return true;
          })
        : marketData;

      return filteredData
        .map((item) => ({ ...item, volumeNumber: parseVolume(item.volume) }))
        .sort((a, b) => b.volumeNumber - a.volumeNumber);
    },
    [showZeroVolume],
  );

  // Load mock data on mount
  useEffect(() => {
    if (skipInitialFetch) {
      setIsLoading(false);
      return;
    }

    // Simulate async data fetch with mock data
    const loadData = async () => {
      try {
        // Combine crypto and HIP-3 markets
        const allMarkets = [...mockCryptoMarkets, ...mockHip3Markets];
        const processedMarkets = processMarkets(allMarkets);
        setMarkets(processedMarkets);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load market data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [skipInitialFetch, processMarkets]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Simulate refresh with mock data
      const allMarkets = [...mockCryptoMarkets, ...mockHip3Markets];
      const processedMarkets = processMarkets(allMarkets);
      setMarkets(processedMarkets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh market data';
      setError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [processMarkets]);

  return {
    markets,
    isLoading,
    error,
    refresh,
    isRefreshing,
  };
};
