import * as React from 'react';
import { Box } from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTheme } from '../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../components/ui/tab-empty-state';
import { ThemeType } from '../../../../../shared/constants/preferences';

export const AssetChartEmptyState = () => {
  const t = useI18nContext();
  const theme = useTheme();

  const assetDetailsIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-asset-details-dark.png'
      : '/images/empty-state-asset-details-light.png';

  return (
    <Box className="asset-chart__empty-or-loading-state-container">
      <TabEmptyState
        icon={
          <img
            src={assetDetailsIcon}
            alt={t('assetChartNoHistoricalPrices')}
            width={72}
            height={72}
          />
        }
        description={t('assetChartNoHistoricalPrices')}
        className="asset-chart__empty-state-content mx-auto"
      />
    </Box>
  );
};
