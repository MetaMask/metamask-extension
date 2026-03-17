import type { PerpsMarketData } from '../../../components/app/perps/types';
import {
  MARKET_SORTING_CONFIG,
  PERPS_CONSTANTS,
} from '../../../components/app/perps/constants';

export type SortField =
  | 'volume'
  | 'priceChange'
  | 'fundingRate'
  | 'openInterest';
export type SortDirection = 'asc' | 'desc';

const multipliers: Record<string, number> = {
  K: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
} as const;

// Pre-compiled regex for better performance
const VOLUME_SUFFIX_REGEX = /\$?([\d.,]+)([KMBT])?/u;

// Helper function to remove commas
const removeCommas = (str: string): string => {
  let result = '';
  for (const char of str) {
    if (char !== ',') {
      result += char;
    }
  }
  return result;
};

/**
 * Parse volume strings with magnitude suffixes (e.g., '$1.2B', '$850M')
 * Returns numeric value for sorting
 *
 * @param volumeStr - The volume string to parse
 * @returns Numeric value for sorting
 */
export const parseVolume = (volumeStr: string | undefined): number => {
  if (!volumeStr) {
    return -1;
  }

  // Handle special cases
  if (volumeStr === PERPS_CONSTANTS.FALLBACK_PRICE_DISPLAY) {
    return -1;
  }
  if (volumeStr === '$<1') {
    return 0.5;
  }

  // Handle suffixed values (e.g., "$1.5M", "$2.3B", "$500K")
  const suffixMatch = VOLUME_SUFFIX_REGEX.exec(volumeStr);
  if (suffixMatch) {
    const [, numberPart, suffix] = suffixMatch;
    const baseValue = Number.parseFloat(removeCommas(numberPart));

    if (Number.isNaN(baseValue)) {
      return -1;
    }

    return suffix ? baseValue * multipliers[suffix] : baseValue;
  }

  return -1;
};

type SortMarketsParams = {
  markets: PerpsMarketData[];
  sortBy: SortField;
  direction?: SortDirection;
};

/**
 * Sorts markets based on the specified criteria
 * Uses object parameters pattern for maintainability
 *
 * @param options - Sort options
 * @param options.markets - Markets to sort
 * @param options.sortBy - Field to sort by
 * @param options.direction - Sort direction
 * @returns Sorted markets
 */
export const sortMarkets = ({
  markets,
  sortBy,
  direction = MARKET_SORTING_CONFIG.DEFAULT_DIRECTION,
}: SortMarketsParams): PerpsMarketData[] => {
  const sortedMarkets = [...markets];

  sortedMarkets.sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case MARKET_SORTING_CONFIG.SORT_FIELDS.VOLUME: {
        // Parse volume strings with magnitude suffixes (e.g., '$1.2B', '$850M')
        const volumeA = parseVolume(a.volume);
        const volumeB = parseVolume(b.volume);
        compareValue = volumeA - volumeB;
        break;
      }

      case MARKET_SORTING_CONFIG.SORT_FIELDS.PRICE_CHANGE: {
        // Use 24h price change percentage (e.g., '+2.5%', '-1.8%')
        // Parse and remove % sign, handle placeholder values like '--' or 'N/A'
        const parsedA = parseFloat(
          a.change24hPercent?.replace(/[%+]/gu, '') || '0',
        );
        const parsedB = parseFloat(
          b.change24hPercent?.replace(/[%+]/gu, '') || '0',
        );
        const changeA = Number.isNaN(parsedA) ? 0 : parsedA;
        const changeB = Number.isNaN(parsedB) ? 0 : parsedB;
        compareValue = changeA - changeB;
        break;
      }

      case MARKET_SORTING_CONFIG.SORT_FIELDS.FUNDING_RATE: {
        // Funding rate is a number (not string)
        const fundingA = a.fundingRate ?? 0;
        const fundingB = b.fundingRate ?? 0;
        compareValue = fundingA - fundingB;
        break;
      }

      case MARKET_SORTING_CONFIG.SORT_FIELDS.OPEN_INTEREST: {
        // Parse open interest strings (similar to volume)
        const openInterestA = parseVolume(a.openInterest);
        const openInterestB = parseVolume(b.openInterest);
        compareValue = openInterestA - openInterestB;
        break;
      }

      default:
        // Unsupported sort field - maintain current order (compareValue remains 0)
        break;
    }

    // Apply sort direction
    return direction === MARKET_SORTING_CONFIG.DEFAULT_DIRECTION
      ? compareValue * -1 // desc (larger first)
      : compareValue; // asc (smaller first)
  });

  return sortedMarkets;
};
