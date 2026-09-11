import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { PERPS_MARKET_LIST_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { MARKET_CATEGORY_ICONS, PERPS_PRODUCT_CATEGORIES } from '../constants';
import {
  PerpsCategoryPillVariant,
  PerpsCategoryRail,
  PerpsCategoryRailLayout,
} from '../perps-market-categories';

export type PerpsProductsProps = {
  /** Whether the tab's market data is still loading its first snapshot. */
  isLoading: boolean;
};

/**
 * PerpsProducts renders the Perps tab's Products section: one chip per market
 * category, each opening the full market list already narrowed to that
 * category.
 *
 * The chip set is fixed rather than derived from the live snapshot, because the
 * market list this section navigates into lists its categories the same way.
 * Deriving them here would leave the two surfaces disagreeing about which
 * categories exist, and would shrink the section to whatever the current
 * snapshot happens to cover.
 *
 * The tab holds no filter of its own — a chip navigates rather than filters —
 * so the rail is given no selection and no clear affordance. The market list it
 * lands on renders its own rail with both.
 *
 * @param options0 - Component props.
 * @param options0.isLoading - Whether the first market snapshot is still loading.
 */
export const PerpsProducts = ({ isLoading }: PerpsProductsProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { track } = usePerpsEventTracking();

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

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-products"
    >
      <Text
        variant={TextVariant.HeadingMd}
        fontWeight={FontWeight.Bold}
        className="px-4"
      >
        {t('perpsProducts')}
      </Text>
      <PerpsCategoryRail
        categories={[...PERPS_PRODUCT_CATEGORIES]}
        onSelect={handleCategoryPress}
        icons={MARKET_CATEGORY_ICONS}
        layout={PerpsCategoryRailLayout.Wrap}
        pillVariant={PerpsCategoryPillVariant.Chip}
        isLoading={isLoading}
        ariaLabel={t('perpsProducts')}
        testId="perps-products-categories"
      />
    </Box>
  );
};

export default PerpsProducts;
