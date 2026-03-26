import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { PerpsSlider } from '../../../perps-slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import type { CloseAmountSectionProps } from '../../order-entry.types';

/**
 * CloseAmountSection - Section for selecting how much of a position to close
 *
 * @param props - Component props
 * @param props.positionSize - Total position size (absolute value)
 * @param props.closePercent - Percentage of position to close (0-100)
 * @param props.onClosePercentChange - Callback when percentage changes
 * @param props.asset - Asset symbol for display
 * @param props.currentPrice - Current asset price for USD calculation
 */
export const CloseAmountSection: React.FC<CloseAmountSectionProps> = ({
  positionSize,
  closePercent,
  onClosePercentChange,
  asset,
  currentPrice,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold, formatTokenQuantity } =
    useFormatters();

  const closeAmount = useMemo(() => {
    const size = Math.abs(parseFloat(positionSize)) || 0;
    return (size * closePercent) / 100;
  }, [positionSize, closePercent]);

  const closeValueUsd = useMemo(() => {
    return closeAmount * currentPrice;
  }, [closeAmount, currentPrice]);

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      onClosePercentChange(percent);
    },
    [onClosePercentChange],
  );

  const totalPositionSize = Math.abs(parseFloat(positionSize)) || 0;

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsAvailableToClose')}
        </Text>
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {formatTokenQuantity(totalPositionSize, asset)}
        </Text>
      </Box>

      <Box
        className="bg-muted rounded-xl"
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          data-testid="close-amount-value"
        >
          {formatCurrencyWithMinThreshold(closeValueUsd, 'USD')}
        </Text>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={4}
      >
        <Box className="flex-1 min-w-0 px-1" data-testid="close-amount-slider">
          <PerpsSlider
            min={0}
            max={100}
            step={1}
            value={closePercent}
            onChange={handleSliderChange}
          />
        </Box>
        <Box
          className="bg-muted flex w-[4.75rem] shrink-0 items-center justify-center rounded-lg px-2 py-1"
          flexDirection={BoxFlexDirection.Row}
        >
          <Text
            className="w-full text-center tabular-nums"
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
          >
            {closePercent} %
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CloseAmountSection;
