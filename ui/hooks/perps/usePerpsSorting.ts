import { useState, useCallback, useMemo } from 'react';
import type { PerpsMarketData } from '../../components/app/perps/types';
import {
  sortMarkets,
  type SortField,
  type SortDirection,
} from '../../pages/perps/utils/sortMarkets';
import {
  MARKET_SORTING_CONFIG,
  type SortOptionId,
} from '../../components/app/perps/constants';

interface UsePerpsSortingParams {
  initialOptionId?: SortOptionId;
}

interface UsePerpsSortingReturn {
  selectedOptionId: SortOptionId;
  sortBy: SortField;
  direction: SortDirection;
  handleOptionChange: (
    optionId: SortOptionId,
    field: SortField,
    direction: SortDirection,
  ) => void;
  sortMarketsList: (markets: PerpsMarketData[]) => PerpsMarketData[];
}

/**
 * Hook for managing market sorting state
 * Uses combined option IDs (e.g., 'volume', 'priceChange-desc') for simplified selection
 */
export const usePerpsSorting = ({
  initialOptionId = MARKET_SORTING_CONFIG.DEFAULT_SORT_OPTION_ID,
}: UsePerpsSortingParams = {}): UsePerpsSortingReturn => {
  const [selectedOptionId, setSelectedOptionId] =
    useState<SortOptionId>(initialOptionId);

  // Derive sortBy and direction from selectedOptionId
  const { sortBy, direction } = useMemo(() => {
    const option = MARKET_SORTING_CONFIG.SORT_OPTIONS.find(
      (opt) => opt.id === selectedOptionId,
    );
    return {
      sortBy: option?.field ?? MARKET_SORTING_CONFIG.SORT_FIELDS.VOLUME,
      direction: option?.direction ?? MARKET_SORTING_CONFIG.DEFAULT_DIRECTION,
    };
  }, [selectedOptionId]);

  const handleOptionChange = useCallback(
    (optionId: SortOptionId, _field: SortField, _direction: SortDirection) => {
      setSelectedOptionId(optionId);
    },
    [],
  );

  const sortMarketsList = useCallback(
    (markets: PerpsMarketData[]) =>
      sortMarkets({
        markets,
        sortBy,
        direction,
      }),
    [sortBy, direction],
  );

  return {
    selectedOptionId,
    sortBy,
    direction,
    handleOptionChange,
    sortMarketsList,
  };
};
