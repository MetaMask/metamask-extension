import { MARKET_SORTING_CONFIG } from '../constants/perpsConfig';
import type { PerpsMarketData } from '../types';

export type SortField =
  | 'volume'
  | 'priceChange'
  | 'fundingRate'
  | 'openInterest';
export type SortDirection = 'asc' | 'desc';

type SortMarketsParams = {
  markets: PerpsMarketData[];
  sortBy: SortField;
  direction?: SortDirection;
};

/**
 * Parse volume string with magnitude suffixes (e.g., '$1.2B', '$850M')
 *
 * @param volume - Volume string with optional magnitude suffix
 * @returns Parsed numeric value
 */
function parseVolume(volume: string | undefined): number {
  if (!volume) {
    return 0;
  }

  // Remove $ and any whitespace
  const cleanedVolume = volume.replace(/[$,\s]/gu, '');

  // Match number with optional suffix (K, M, B, T)
  const match = cleanedVolume.match(/^([\d.]+)([KMBT])?$/iu);
  if (!match) {
    return 0;
  }

  const parsedValue = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  const multipliers: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
    T: 1_000_000_000_000,
  };

  return suffix ? parsedValue * (multipliers[suffix] ?? 1) : parsedValue;
}

/**
 * Sorts markets based on the specified criteria.
 * Uses object parameters pattern for maintainability.
 *
 * @param options - Sort options object
 * @param options.markets - Array of market data to sort
 * @param options.sortBy - Field to sort by (volume, priceChange, fundingRate, openInterest)
 * @param options.direction - Sort direction (asc or desc, defaults to desc)
 * @returns Sorted array of market data
 */
export const sortMarkets = ({
  markets,
  sortBy,
  direction = MARKET_SORTING_CONFIG.DefaultDirection,
}: SortMarketsParams): PerpsMarketData[] => {
  const sortedMarkets = [...markets];

  sortedMarkets.sort((marketA, marketB) => {
    let compareValue = 0;

    switch (sortBy) {
      case MARKET_SORTING_CONFIG.SortFields.Volume: {
        const volumeA = parseVolume(marketA.volume);
        const volumeB = parseVolume(marketB.volume);
        compareValue = volumeA - volumeB;
        break;
      }

      case MARKET_SORTING_CONFIG.SortFields.PriceChange: {
        const changeA = parseFloat(
          marketA.change24hPercent?.replace(/[%+]/gu, '') || '0',
        );
        const changeB = parseFloat(
          marketB.change24hPercent?.replace(/[%+]/gu, '') || '0',
        );
        compareValue = changeA - changeB;
        break;
      }

      case MARKET_SORTING_CONFIG.SortFields.FundingRate: {
        const fundingA = marketA.fundingRate ?? 0;
        const fundingB = marketB.fundingRate ?? 0;
        compareValue = fundingA - fundingB;
        break;
      }

      case MARKET_SORTING_CONFIG.SortFields.OpenInterest: {
        const openInterestA = parseVolume(marketA.openInterest);
        const openInterestB = parseVolume(marketB.openInterest);
        compareValue = openInterestA - openInterestB;
        break;
      }

      default:
        // Unsupported sort field - maintain current order
        break;
    }

    // Apply sort direction
    return direction === MARKET_SORTING_CONFIG.DefaultDirection
      ? compareValue * -1 // desc (larger first)
      : compareValue; // asc (smaller first)
  });

  return sortedMarkets;
};
