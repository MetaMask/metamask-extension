import * as React from 'react';
import { Box, Text } from '../../../../components/component-library';
import {
  BlockSize,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const AssetChartEmptyState = () => {
  const t = useI18nContext();
  return (
    <Box className="asset-chart__empty-or-loading-state-container">
      <Box className="asset-chart__empty-state-content">
        <img
          src="./images/asset-chart-empty-state-illustration.png"
          className="asset-chart__empty-state-illustration"
        />
        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
          fontWeight={FontWeight.Medium}
          paddingTop={4}
          paddingRight={2}
          paddingBottom={4}
          paddingLeft={2}
          width={BlockSize.Full}
        >
          {t('assetChartNoHistoricalPrices')}
        </Text>
      </Box>
    </Box>
  );
};
