import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
  type IconName,
} from '@metamask/design-system-react';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MARKET_FILTER_LABEL_KEYS } from '../constants';
import { Dropdown, type DropdownOption } from '../dropdown';
import {
  PerpsCategoryPillVariant,
  PerpsMarketCategoryPill,
} from './perps-market-category-pill';
import { useCategoryRailOverflow } from './use-category-rail-overflow';

/**
 * Skeleton pill footprint. Height matches the real pill so the rail occupies
 * its final height from first paint and nothing below it shifts when the
 * categories arrive.
 */
const SKELETON_PILL_STYLES = 'h-8 w-20 shrink-0 rounded-lg';
const SKELETON_PILL_KEYS = ['a', 'b', 'c', 'd', 'e'];

/** How many pills the loading rail reserves room for. */
export const SKELETON_PILL_COUNT = SKELETON_PILL_KEYS.length;

/** Ghost styling for the overflow trigger, so it reads as one more filter. */
const MORE_TRIGGER_STYLES =
  'h-8 w-auto shrink-0 whitespace-nowrap rounded-lg bg-background-muted px-3';

/**
 * How the design lays a rail out, which differs per surface rather than per
 * breakpoint.
 *
 * `Wrap` — the Perps tab's Products section (Figma `13192:28387`): every chip is
 * on screen, wrapping onto further lines when they do not fit one.
 *
 * `Overflow` — the market list's filter rail (Figma `12602:45702`): one row,
 * with whatever does not fit moved into a `More` menu (Figma `12608:46888`). At
 * a wider window every category fits and no trigger is rendered at all.
 */
export const PerpsCategoryRailLayout = {
  Wrap: 'wrap',
  Overflow: 'overflow',
} as const;

export type PerpsCategoryRailLayout =
  (typeof PerpsCategoryRailLayout)[keyof typeof PerpsCategoryRailLayout];

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
  /**
   * Leading glyph per category. Supplied by the Products section; the market
   * list's own rail renders bare pills.
   */
  icons?: Partial<Record<MarketFilter, IconName>>;
  /** Which of the design's two layouts to use. */
  layout?: PerpsCategoryRailLayout;
  /** Which of the design's two pill shapes to render. */
  pillVariant?: PerpsCategoryPillVariant;
  /** Whether the market data behind the categories is still loading. */
  isLoading?: boolean;
  /** Accessible name for the rail. */
  ariaLabel: string;
  /** Test id for the rail container. */
  testId?: string;
};

/**
 * PerpsCategoryRail lays market categories out as pills, in whichever of the
 * design's two layouts the surface calls for.
 *
 * Neither layout scrolls horizontally: a horizontal scroller is a mobile
 * gesture pattern that on the web hides items behind an interaction mouse users
 * cannot see coming and keyboard users cannot track focus through. `Wrap`
 * spends vertical space instead; `Overflow` measures the fit and moves the
 * remainder into a labelled menu.
 *
 * Categories keep their given order in both layouts; `Overflow` splits that
 * order at the fit boundary rather than promoting the active category, which is
 * what the design shows. When the active category lands in the menu, the menu
 * carries the selection so the filter in force stays visible, and choosing it
 * again clears it.
 *
 * @param options0 - Component props.
 * @param options0.categories - Categories to offer, in display order.
 * @param options0.selectedCategory - The active category, if any.
 * @param options0.onSelect - Called with a category when it is chosen.
 * @param options0.onClear - Called when the active category is deselected.
 * @param options0.icons - Leading glyph per category, when the surface uses them.
 * @param options0.layout - Which of the design's two layouts to use.
 * @param options0.pillVariant - Which of the design's two pill shapes to render.
 * @param options0.isLoading - Whether the market data is still loading.
 * @param options0.ariaLabel - Accessible name for the rail.
 * @param options0.testId - Test id for the rail container.
 */
export const PerpsCategoryRail = ({
  categories,
  selectedCategory = null,
  onSelect,
  onClear,
  icons,
  layout = PerpsCategoryRailLayout.Overflow,
  pillVariant = PerpsCategoryPillVariant.Filter,
  isLoading = false,
  ariaLabel,
  testId = 'perps-market-categories',
}: PerpsCategoryRailProps) => {
  const t = useI18nContext();
  const isOverflow = layout === PerpsCategoryRailLayout.Overflow;

  const { rowRef, registerItem, visibleCount } =
    useCategoryRailOverflow(categories);

  // Before the first measurement every pill is rendered, which is what gives
  // the hook a width to read.
  const fittedCount = isOverflow
    ? (visibleCount ?? categories.length)
    : categories.length;
  const visibleCategories = categories.slice(0, fittedCount);
  const overflowCategories = categories.slice(fittedCount);

  const overflowOptions: DropdownOption<MarketFilter>[] = useMemo(
    () =>
      overflowCategories.map((category) => ({
        id: category,
        label: t(MARKET_FILTER_LABEL_KEYS[category]),
      })),
    [overflowCategories, t],
  );

  const overflowSelection =
    selectedCategory && overflowCategories.includes(selectedCategory)
      ? selectedCategory
      : null;

  const handleOverflowChange = useCallback(
    (category: MarketFilter) => {
      // Choosing the category already in force clears it, so an overflowed
      // filter has the same escape hatch a visible pill does.
      if (category === selectedCategory && onClear) {
        onClear();
        return;
      }
      onSelect(category);
    },
    [onClear, onSelect, selectedCategory],
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

  const pills = visibleCategories.map((category) => (
    <PerpsMarketCategoryPill
      key={category}
      category={category}
      isActive={category === selectedCategory}
      onPress={onSelect}
      onClear={onClear}
      iconName={icons?.[category]}
      variant={pillVariant}
      testIdPrefix={testId}
    />
  ));

  if (!isOverflow) {
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
        {pills}
      </Box>
    );
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
        {visibleCategories.map((category, index) => (
          <Box
            key={category}
            ref={registerItem(category)}
            className="shrink-0"
            data-testid={`${testId}-item-${category}`}
          >
            {pills[index]}
          </Box>
        ))}
      </Box>
      {overflowCategories.length > 0 && (
        <Box className="shrink-0">
          <Dropdown
            options={overflowOptions}
            selectedId={overflowSelection}
            onChange={handleOverflowChange}
            triggerLabel={t('perpsFilterMore')}
            triggerClassName={MORE_TRIGGER_STYLES}
            // The trigger is always the last thing on the rail, so a
            // left-anchored menu would open past the edge of a narrow window.
            menuClassName="left-auto right-0"
            // A selection that overflowed is still shown on the rail: the
            // trigger takes the active fill so the user can see the filter in
            // force is inside this menu.
            isTriggerActive={Boolean(overflowSelection)}
            triggerAriaLabel={
              overflowSelection
                ? t('perpsFilterMoreSelected', [
                    t(MARKET_FILTER_LABEL_KEYS[overflowSelection]),
                  ])
                : undefined
            }
            testId={`${testId}-more`}
          />
        </Box>
      )}
    </Box>
  );
};

export default PerpsCategoryRail;
