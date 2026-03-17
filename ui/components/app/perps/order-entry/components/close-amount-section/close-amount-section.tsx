import React, { useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonBase,
} from '@metamask/design-system-react';
import { PerpsSlider } from '../../../perps-slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import type { CloseAmountSectionProps } from '../../order-entry.types';

/**
 * Preset percentage buttons for close amount slider
 */
const CLOSE_PERCENT_PRESETS = [25, 50, 75, 100] as const;

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

  // Calculate the amount to close based on percentage
  const closeAmount = useMemo(() => {
    const size = Math.abs(parseFloat(positionSize)) || 0;
    return (size * closePercent) / 100;
  }, [positionSize, closePercent]);

  // Calculate USD value of close amount
  const closeValueUsd = useMemo(() => {
    return closeAmount * currentPrice;
  }, [closeAmount, currentPrice]);

  // Handle slider change
  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      onClosePercentChange(percent);
    },
    [onClosePercentChange],
  );

  // Handle percentage preset button click
  const handlePercentClick = useCallback(
    (percent: number) => {
      onClosePercentChange(percent);
    },
    [onClosePercentChange],
  );

  const totalPositionSize = Math.abs(parseFloat(positionSize)) || 0;

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Position Size Reference */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsPositionSize')}
        </Text>
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {formatTokenQuantity(totalPositionSize, asset)}
        </Text>
      </Box>

      {/* Close Amount Section */}
      <Box
        className="bg-muted rounded-xl"
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
      >
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          {/* Label */}
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsCloseAmount')}
          </Text>

          {/* Close Amount Display - Large and prominent */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Baseline}
            justifyContent={BoxJustifyContent.Between}
          >
            <Text
              variant={TextVariant.HeadingMd}
              fontWeight={FontWeight.Medium}
              data-testid="close-amount-value"
            >
              {formatTokenQuantity(closeAmount, asset)}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              {closePercent}%
            </Text>
          </Box>

          {/* USD Value */}
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            ≈ {formatCurrencyWithMinThreshold(closeValueUsd, 'USD')}
          </Text>
        </Box>
      </Box>

      {/* Percentage Slider */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box className="px-3" data-testid="close-amount-slider">
          <PerpsSlider
            min={0}
            max={100}
            step={1}
            value={closePercent}
            onChange={handleSliderChange}
          />
        </Box>

        {/* Percentage Preset Buttons */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          className="w-full"
        >
          {CLOSE_PERCENT_PRESETS.map((preset) => (
            <ButtonBase
              key={preset}
              onClick={() => handlePercentClick(preset)}
              className={twMerge(
                'px-3 py-1 rounded-md text-sm',
                closePercent === preset
                  ? 'bg-primary-muted text-primary-default'
                  : 'bg-transparent text-muted hover:bg-muted-hover',
              )}
              data-testid={`close-percent-preset-${preset}`}
            >
              {preset}%
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default CloseAmountSection;
