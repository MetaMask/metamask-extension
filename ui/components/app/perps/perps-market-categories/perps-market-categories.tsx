import React, { useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Skeleton,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import type { MarketCategoryFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { PERPS_MARKET_LIST_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { usePerpsMarketCategories } from '../hooks/usePerpsMarketCategories';
import type { PerpsMarketData } from '../types';
import { PerpsMarketCategoryPill } from './perps-market-category-pill';

/**
 * Skeleton pill footprint. Height matches the real pill so the rail occupies
 * its final height from first paint and nothing below it shifts when the
 * categories arrive.
 */
const SKELETON_PILL_STYLES = 'h-8 w-20 shrink-0 rounded-full';
const SKELETON_PILL_KEYS = ['a', 'b', 'c', 'd', 'e'];

export type PerpsMarketCategoriesProps = {
  /** Live markets, owned by the Perps tab's market-list stream. */
  markets: PerpsMarketData[];
  /** Whether the tab's market data is still loading its first snapshot. */
  isLoading: boolean;
};

/**
 * PerpsMarketCategories renders the Perps tab's category rail: one pill per
 * market category present in the live data, each opening the full market list
 * already narrowed to that category.
 *
 * The design system ships no filter-group primitive for web — checked the
 * installed 0.35.1 and the latest published 0.38.0 of
 * `@metamask/design-system-react`, neither exports one — so the rail is
 * composed from `ButtonFilter` inside a horizontal scroller.
 *
 * Receives markets from the Perps tab rather than subscribing itself, so the
 * tab keeps a single owner of the shared market-list price stream.
 *
 * @param options0 - Component props.
 * @param options0.markets - Live markets to derive categories from.
 * @param options0.isLoading - Whether the first market snapshot is still loading.
 */
export const PerpsMarketCategories = ({
  markets,
  isLoading,
}: PerpsMarketCategoriesProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { track } = usePerpsEventTracking();
  const categories = usePerpsMarketCategories(markets);

  const handleCategoryPress = useCallback(
    (category: MarketCategoryFilter) => {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.FILTER_APPLIED,
        [PERPS_EVENT_PROPERTY.FILTER_CATEGORY]: category,
        [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
          PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
      });
      navigate(`${PERPS_MARKET_LIST_ROUTE}?filter=${category}`);
    },
    [navigate, track],
  );

  if (isLoading) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="flex-nowrap overflow-hidden px-4"
        data-testid="perps-market-categories-skeleton"
      >
        {SKELETON_PILL_KEYS.map((pillKey) => (
          <Skeleton
            key={`perps-market-categories-skeleton-pill-${pillKey}`}
            className={SKELETON_PILL_STYLES}
          />
        ))}
      </Box>
    );
  }

  // Once the markets have loaded, a rail carrying only the `all` shortcut means
  // no market data reached the tab at all, so there is nothing to categorise.
  if (categories.length <= 1) {
    return null;
  }

  return (
    <Box
      className="overflow-x-auto"
      role="group"
      aria-label={t('perpsMarketCategories')}
      data-testid="perps-market-categories"
    >
      {/* Padding lives on the scroll content, matching Top movers: on a flex
          overflow container, px-4 on the scroller itself is dropped at the
          inline end. */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="w-max flex-nowrap px-4"
        data-testid="perps-market-categories-list"
      >
        {categories.map((category) => (
          <PerpsMarketCategoryPill
            key={category}
            category={category}
            onPress={handleCategoryPress}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PerpsMarketCategories;
