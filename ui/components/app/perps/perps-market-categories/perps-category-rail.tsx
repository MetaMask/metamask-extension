import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { PerpsMarketCategoryPill } from './perps-market-category-pill';

/**
 * Skeleton pill footprint. Height matches the real pill so the rail occupies
 * its final height from first paint and nothing below it shifts when the
 * categories arrive.
 */
const SKELETON_PILL_STYLES = 'h-8 w-20 shrink-0 rounded-full';
const SKELETON_PILL_KEYS = ['a', 'b', 'c', 'd', 'e'];

/** How many pills the loading rail reserves room for. */
export const SKELETON_PILL_COUNT = SKELETON_PILL_KEYS.length;

export type PerpsCategoryRailProps = {
  /** Categories to offer, in display order. */
  categories: MarketFilter[];
  /** The active category, or `null` when the rail holds no selection. */
  selectedCategory: MarketFilter | null;
  /** Called with a category when it is chosen. */
  onSelect: (category: MarketFilter) => void;
  /** Called when the active category is pressed again, clearing the filter. */
  onClear: () => void;
  /** Whether the market data behind the categories is still loading. */
  isLoading?: boolean;
  /** Accessible name for the rail. */
  ariaLabel: string;
  /** Test id for the rail container. */
  testId?: string;
};

/**
 * PerpsCategoryRail lays market categories out as pills, wrapping onto further
 * lines when they do not all fit on one.
 *
 * Every category is always on screen. It never scrolls horizontally and never
 * moves anything into an overflow menu: both hide items behind an interaction
 * mouse users cannot see coming and keyboard users cannot track focus through.
 * Wrapping costs vertical space instead, which the popup can give.
 *
 * @param options0 - Component props.
 * @param options0.categories - Categories to offer, in display order.
 * @param options0.selectedCategory - The active category, if any.
 * @param options0.onSelect - Called with a category when it is chosen.
 * @param options0.onClear - Called when the active category is deselected.
 * @param options0.isLoading - Whether the market data is still loading.
 * @param options0.ariaLabel - Accessible name for the rail.
 * @param options0.testId - Test id for the rail container.
 */
export const PerpsCategoryRail = ({
  categories,
  selectedCategory,
  onSelect,
  onClear,
  isLoading = false,
  ariaLabel,
  testId = 'perps-market-categories',
}: PerpsCategoryRailProps) => {
  if (isLoading) {
    return (
      <Box className="px-4">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="overflow-hidden"
          data-testid={`${testId}-skeleton`}
        >
          {SKELETON_PILL_KEYS.map((pillKey) => (
            <Skeleton
              key={`${testId}-skeleton-pill-${pillKey}`}
              className={SKELETON_PILL_STYLES}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <Box
      className="flex-wrap px-4"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      role="group"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {categories.map((category) => (
        <PerpsMarketCategoryPill
          key={category}
          category={category}
          isActive={category === selectedCategory}
          onPress={onSelect}
          onClear={onClear}
          testIdPrefix={testId}
        />
      ))}
    </Box>
  );
};

export default PerpsCategoryRail;
