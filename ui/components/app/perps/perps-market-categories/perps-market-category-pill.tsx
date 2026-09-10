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
  /** Called when the active pill is pressed again, clearing the filter. */
  onClear: () => void;
  /** Test id prefix, inherited from the rail so surfaces stay addressable apart. */
  testIdPrefix?: string;
};

/**
 * PerpsMarketCategoryPill renders one market category as a `ButtonFilter`.
 *
 * The pill is a toggle rather than a link: pressing the active one clears the
 * filter, which is what `aria-pressed` and the trailing clear icon announce.
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

  const handleClick = useCallback(() => {
    if (isActive) {
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
      aria-pressed={isActive}
      aria-label={isActive ? t('perpsFilterClear', [label]) : undefined}
      data-testid={`${testIdPrefix}-pill-${category}`}
    >
      {label}
      {isActive && (
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
