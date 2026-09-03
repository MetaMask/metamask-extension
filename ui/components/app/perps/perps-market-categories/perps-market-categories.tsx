import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MarketFilter } from '../../../../../shared/constants/perps';
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
import { PerpsCategoryRail } from './perps-category-rail';

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
 * The tab holds no filter of its own — a pill navigates rather than filters —
 * so the rail is given no selection and no clear affordance. The market list it
 * lands on renders the same rail with both.
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
    (category: MarketFilter) => {
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

  // Once the markets have loaded, a rail carrying only the `all` shortcut means
  // no market data reached the tab at all, so there is nothing to categorise.
  if (!isLoading && categories.length <= 1) {
    return null;
  }

  return (
    <PerpsCategoryRail
      categories={categories}
      onSelect={handleCategoryPress}
      isLoading={isLoading}
      ariaLabel={t('perpsMarketCategories')}
    />
  );
};

export default PerpsMarketCategories;
