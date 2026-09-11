import React, { useCallback } from 'react';
import {
  ButtonBaseSize,
  ButtonFilter,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MARKET_FILTER_LABEL_KEYS } from '../constants';

/**
 * The two shapes the design gives a category control, which differ by more than
 * a token: the Perps tab's Products chip is a 40px lozenge carrying a leading
 * glyph (Figma `13192:28387`), while the market list's filter is a 32px
 * 8px-radius button whose only accessory is the clear affordance
 * (Figma `12602:45702`).
 */
export const PerpsCategoryPillVariant = {
  Chip: 'chip',
  Filter: 'filter',
} as const;

export type PerpsCategoryPillVariant =
  (typeof PerpsCategoryPillVariant)[keyof typeof PerpsCategoryPillVariant];

/** `w-auto`/`shrink-0` override ButtonBase's full-width default. */
const SHARED_STYLES = 'w-auto shrink-0 whitespace-nowrap';

const VARIANT_STYLES: Record<PerpsCategoryPillVariant, string> = {
  // 8px content inset with 2px more on the inline end, so the label does not
  // crowd the rounded edge.
  [PerpsCategoryPillVariant.Chip]: 'rounded-full pl-2 pr-2.5',
  [PerpsCategoryPillVariant.Filter]: 'rounded-lg px-3',
};

const VARIANT_SIZES: Record<PerpsCategoryPillVariant, ButtonBaseSize> = {
  [PerpsCategoryPillVariant.Chip]: ButtonBaseSize.Md,
  [PerpsCategoryPillVariant.Filter]: ButtonBaseSize.Sm,
};

export type PerpsMarketCategoryPillProps = {
  /** Market category this pill selects. */
  category: MarketFilter;
  /** Called with the category when the pill is pressed. */
  onPress: (category: MarketFilter) => void;
  /** Whether this pill is the active filter. */
  isActive?: boolean;
  /**
   * Called when the active pill is pressed again. Presence of this handler is
   * what turns the active pill into a clear affordance, so a surface that only
   * navigates (the Perps tab's Products section) never renders one.
   */
  onClear?: () => void;
  /**
   * Leading glyph. The Products design gives every chip one; the market list's
   * own filter buttons are bare, so it is optional.
   */
  iconName?: IconName;
  /** Which of the design's two shapes to render. */
  variant?: PerpsCategoryPillVariant;
  /** Test id prefix, inherited from the rail so surfaces stay addressable apart. */
  testIdPrefix?: string;
};

/**
 * PerpsMarketCategoryPill renders one market category as a `ButtonFilter`.
 *
 * No `aria-pressed` when the rail cannot hold a selection: on the Perps tab the
 * pill is a navigation trigger, not a toggle, so a pressed state would
 * misreport it. On the market list it filters in place and does report one.
 *
 * @param options0 - Component props.
 * @param options0.category - The category to render.
 * @param options0.onPress - Called with the category when the pill is pressed.
 * @param options0.isActive - Whether this pill is the active filter.
 * @param options0.onClear - Called when the active pill is pressed again.
 * @param options0.iconName - Leading glyph, when the surface uses one.
 * @param options0.variant - Which of the design's two shapes to render.
 * @param options0.testIdPrefix - Test id prefix inherited from the rail.
 */
export const PerpsMarketCategoryPill = ({
  category,
  onPress,
  isActive = false,
  onClear,
  iconName,
  variant = PerpsCategoryPillVariant.Filter,
  testIdPrefix = 'perps-market-categories',
}: PerpsMarketCategoryPillProps) => {
  const t = useI18nContext();
  const isClearable = Boolean(onClear);

  const handleClick = useCallback(() => {
    if (isActive && onClear) {
      onClear();
      return;
    }
    onPress(category);
  }, [isActive, onClear, onPress, category]);

  const label = t(MARKET_FILTER_LABEL_KEYS[category]);

  // `ButtonFilter` fills the active pill with `bg-icon-default` and flips its
  // text to `text-icon-inverse`. An `Icon` does not inherit that — it defaults
  // to `icon-default`, which on the active pill is the fill colour, so the
  // glyph goes invisible. Both glyphs follow the label instead.
  const glyphColor = isActive ? IconColor.IconInverse : IconColor.IconDefault;

  return (
    <ButtonFilter
      className={`${SHARED_STYLES} ${VARIANT_STYLES[variant]}`}
      size={VARIANT_SIZES[variant]}
      isActive={isActive}
      onClick={handleClick}
      aria-pressed={isClearable ? isActive : undefined}
      aria-label={
        isActive && isClearable ? t('perpsFilterClear', [label]) : undefined
      }
      data-testid={`${testIdPrefix}-pill-${category}`}
    >
      {iconName && (
        <Icon
          name={iconName}
          size={IconSize.Sm}
          color={glyphColor}
          className="mr-1 shrink-0"
        />
      )}
      {label}
      {isActive && isClearable && (
        // The design's asset is the `clear` component, whose own keywords list
        // "circle x"; `CircleX` is the name for that glyph that every
        // design-system version in use carries. `IconName.Clear` resolves to
        // undefined on some installs, and `Icon` then renders nothing at all,
        // which silently drops the only control that clears the filter.
        <Icon
          name={IconName.CircleX}
          size={IconSize.Xs}
          color={glyphColor}
          className="ml-2 shrink-0"
        />
      )}
    </ButtonFilter>
  );
};

export default PerpsMarketCategoryPill;
