import React, { useCallback } from 'react';
import { ButtonFilter } from '@metamask/design-system-react';
import type { MarketCategoryFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MARKET_FILTER_LABEL_KEYS } from '../constants';

/**
 * A content-width lozenge that hugs its label. `w-auto`/`shrink-0` override
 * ButtonBase's full-width default, and `h-8` fixes the footprint the skeleton
 * rail reserves while market data loads.
 */
const PILL_STYLES = 'h-8 w-auto shrink-0 whitespace-nowrap rounded-full px-3';

export type PerpsMarketCategoryPillProps = {
  /** Market category this pill opens the market list on. */
  category: MarketCategoryFilter;
  /** Called with the category when the pill is pressed. */
  onPress: (category: MarketCategoryFilter) => void;
};

/**
 * PerpsMarketCategoryPill renders one market category as a `ButtonFilter`.
 *
 * No `aria-pressed`: nothing on the Perps tab is selected — the pill is a
 * navigation trigger, not a toggle — so a pressed state would misreport it.
 *
 * @param options0 - Component props.
 * @param options0.category - The category to render.
 * @param options0.onPress - Called with the category when the pill is pressed.
 */
export const PerpsMarketCategoryPill = ({
  category,
  onPress,
}: PerpsMarketCategoryPillProps) => {
  const t = useI18nContext();

  const handleClick = useCallback(() => {
    onPress(category);
  }, [onPress, category]);

  return (
    <ButtonFilter
      className={PILL_STYLES}
      onClick={handleClick}
      data-testid={`perps-market-categories-pill-${category}`}
    >
      {t(MARKET_FILTER_LABEL_KEYS[category])}
    </ButtonFilter>
  );
};

export default PerpsMarketCategoryPill;
