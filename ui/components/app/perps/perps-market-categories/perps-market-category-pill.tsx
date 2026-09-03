import React, { useCallback } from 'react';
import {
  ButtonFilter,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MARKET_FILTER_LABEL_KEYS } from '../constants';

/**
 * A content-width lozenge that hugs its label. `w-auto`/`shrink-0` override
 * ButtonBase's full-width default, and `h-8` fixes the footprint the skeleton
 * rail reserves while market data loads.
 */
const PILL_STYLES = 'h-8 w-auto shrink-0 whitespace-nowrap rounded-full px-3';

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
   * navigates (the Perps tab) never renders one.
   */
  onClear?: () => void;
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
 * @param options0.testIdPrefix - Test id prefix inherited from the rail.
 */
export const PerpsMarketCategoryPill = ({
  category,
  onPress,
  isActive = false,
  onClear,
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

  return (
    <ButtonFilter
      className={PILL_STYLES}
      isActive={isActive}
      onClick={handleClick}
      aria-pressed={isClearable ? isActive : undefined}
      aria-label={
        isActive && isClearable ? t('perpsFilterClear', [label]) : undefined
      }
      data-testid={`${testIdPrefix}-pill-${category}`}
    >
      {label}
      {isActive && isClearable && (
        <Icon
          name={IconName.CircleX}
          size={IconSize.Sm}
          className="ml-1 shrink-0"
        />
      )}
    </ButtonFilter>
  );
};

export default PerpsMarketCategoryPill;
