import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MARKET_FILTER_LABEL_KEYS } from '../constants';
import { Dropdown, type DropdownOption } from '../dropdown';
import { PerpsMarketCategoryPill } from './perps-market-category-pill';
import { useCategoryRailOverflow } from './use-category-rail-overflow';

/**
 * Skeleton pill footprint. Height matches the real pill so the rail occupies
 * its final height from first paint and nothing below it shifts when the
 * categories arrive.
 */
const SKELETON_PILL_STYLES = 'h-8 w-20 shrink-0 rounded-full';
const SKELETON_PILL_KEYS = ['a', 'b', 'c', 'd', 'e'];

/** Ghost styling for the overflow trigger, so it reads as one more pill. */
const MORE_TRIGGER_STYLES =
  'h-8 w-auto shrink-0 whitespace-nowrap rounded-full bg-background-muted px-3';

export type PerpsCategoryRailProps = {
  /** Categories to offer, in display order. */
  categories: MarketFilter[];
  /** The active category, or `null` when the rail holds no selection. */
  selectedCategory?: MarketFilter | null;
  /** Called with a category when it is chosen. */
  onSelect: (category: MarketFilter) => void;
  /**
   * Called when the active category is deselected. Supplying it is what gives
   * the active pill its clear affordance; a rail that only navigates omits it.
   */
  onClear?: () => void;
  /** Whether the market data behind the categories is still loading. */
  isLoading?: boolean;
  /** Accessible name for the rail. */
  ariaLabel: string;
  /** Test id for the rail container. */
  testId?: string;
};

/**
 * PerpsCategoryRail lays market categories out as a single row of pills and
 * moves whatever does not fit into a "More" menu.
 *
 * It never scrolls horizontally. A horizontal scroller is a mobile gesture
 * pattern: on the web it hides items behind an interaction mouse users cannot
 * see coming and keyboard users cannot track focus through, which is why the
 * fit is measured rather than assumed. In an expanded window every category
 * fits and no "More" trigger is rendered at all.
 *
 * The active category is always kept in the visible row — promoted to the front
 * when it would otherwise fall into the menu — so the current filter and its
 * clear affordance can never be hidden behind a second click.
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
  selectedCategory = null,
  onSelect,
  onClear,
  isLoading = false,
  ariaLabel,
  testId = 'perps-market-categories',
}: PerpsCategoryRailProps) => {
  const t = useI18nContext();

  // Keeping the active category in the row costs one reorder; leaving it in the
  // menu would hide the filter the list is currently under.
  const orderedCategories = useMemo(() => {
    if (!selectedCategory || !categories.includes(selectedCategory)) {
      return categories;
    }
    return [
      selectedCategory,
      ...categories.filter((category) => category !== selectedCategory),
    ];
  }, [categories, selectedCategory]);

  const { rowRef, registerItem, visibleCount } =
    useCategoryRailOverflow(orderedCategories);

  // Before the first measurement every pill is rendered, which is what gives
  // the hook a width to read.
  const fittedCount = visibleCount ?? orderedCategories.length;
  const visibleCategories = orderedCategories.slice(0, fittedCount);
  const overflowCategories = orderedCategories.slice(fittedCount);

  const overflowOptions: DropdownOption<MarketFilter>[] = useMemo(
    () =>
      overflowCategories.map((category) => ({
        id: category,
        label: t(MARKET_FILTER_LABEL_KEYS[category]),
      })),
    [overflowCategories, t],
  );

  const handleOverflowChange = useCallback(
    (category: MarketFilter) => {
      onSelect(category);
    },
    [onSelect],
  );

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
      className="px-4"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      role="group"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {/* Only the pills are clipped. The More trigger is deliberately a sibling
          of this row rather than a child: its menu drops below the rail, and a
          clipping ancestor would cut the menu off at the rail's own height.
          Keeping it outside also means the row measures the space that is
          actually left for pills, with no width arithmetic of its own. */}
      <Box
        ref={rowRef}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="min-w-0 flex-1 overflow-x-clip"
        data-testid={`${testId}-row`}
      >
        {visibleCategories.map((category) => (
          <Box
            key={category}
            ref={registerItem(category)}
            className="shrink-0"
            data-testid={`${testId}-item-${category}`}
          >
            <PerpsMarketCategoryPill
              category={category}
              isActive={category === selectedCategory}
              onPress={onSelect}
              onClear={onClear}
              testIdPrefix={testId}
            />
          </Box>
        ))}
      </Box>
      {overflowCategories.length > 0 && (
        <Box className="shrink-0">
          <Dropdown
            options={overflowOptions}
            selectedId={null}
            onChange={handleOverflowChange}
            triggerLabel={t('perpsFilterMore')}
            triggerClassName={MORE_TRIGGER_STYLES}
            // The trigger is always the last thing on the rail, so a
            // left-anchored menu would open past the edge of a narrow window.
            menuClassName="left-auto right-0"
            testId={`${testId}-more`}
          />
        </Box>
      )}
    </Box>
  );
};

export default PerpsCategoryRail;
