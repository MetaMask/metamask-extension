import React, { forwardRef } from 'react';
import type { CandleData } from '@metamask/perps-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  PerpsCandlestickChart,
  type ChartPriceLine,
  type PerpsCandlestickChartRef,
} from '../perps-candlestick-chart';
import { CandlePeriod } from '../constants/chartConfig';

export const PERPS_CHART_HEIGHT = 250;

export type PerpsChartContentProps = {
  isLoading: boolean;
  error: Error | null;
  candleData: CandleData | null;
  selectedPeriod: CandlePeriod;
  currentPrice: number;
  priceLines?: ChartPriceLine[];
  onNeedMoreHistory?: () => void;
};

/**
 * Shared loading / error / chart shell used by market detail and order entry.
 */
export const PerpsChartContent = forwardRef<
  PerpsCandlestickChartRef,
  PerpsChartContentProps
>(
  (
    {
      isLoading,
      error,
      candleData,
      selectedPeriod,
      currentPrice,
      priceLines,
      onNeedMoreHistory,
    },
    ref,
  ) => {
    const t = useI18nContext();

    if (isLoading && !candleData) {
      return (
        <Skeleton
          className="h-[250px] w-full rounded-lg"
          data-testid="perps-chart-content-loading"
        />
      );
    }

    if (error && !candleData) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="h-[250px] w-full rounded-lg bg-muted"
          gap={2}
          data-testid="perps-chart-content-error"
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Lg}
            color={IconColor.IconAlternative}
          />
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsChartLoadError')}
          </Text>
        </Box>
      );
    }

    return (
      <PerpsCandlestickChart
        ref={ref}
        height={PERPS_CHART_HEIGHT}
        selectedPeriod={selectedPeriod}
        candleData={candleData}
        currentPrice={currentPrice}
        priceLines={priceLines}
        onNeedMoreHistory={onNeedMoreHistory}
      />
    );
  },
);

PerpsChartContent.displayName = 'PerpsChartContent';
