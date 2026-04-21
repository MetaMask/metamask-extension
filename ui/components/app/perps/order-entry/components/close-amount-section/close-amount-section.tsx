import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxBackgroundColor,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import {
  formatPerpsFiat,
  formatPositionSize,
  PRICE_RANGES_MINIMAL_VIEW,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../../../shared/lib/perps-formatters';
import { PerpsSlider } from '../../../perps-slider';
import { getDisplaySymbol } from '../../../utils';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { CloseAmountSectionProps } from '../../order-entry.types';

/** Fixed width (rem) for the close-% chip so the slider row layout stays stable as digits change */
const CLOSE_PERCENT_CHIP_WIDTH_REM = 4.75;

/**
 * CloseAmountSection - Section for selecting how much of a position to close
 *
 * @param props - Component props
 * @param props.positionSize - Total position size (absolute value); labeled "Available to close"
 * @param props.closePercent - Percentage of position to close (0-100)
 * @param props.onClosePercentChange - Callback when percentage changes
 * @param props.asset - Asset symbol for display
 * @param props.currentPrice - Current asset price for USD calculation
 * @param props.sizeDecimals - Market size decimals for controller-based size formatting
 */
export const CloseAmountSection: React.FC<CloseAmountSectionProps> = ({
  positionSize,
  closePercent,
  onClosePercentChange,
  asset,
  currentPrice,
  sizeDecimals,
}) => {
  const t = useI18nContext();

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
          {`${formatPositionSize(totalPositionSize, sizeDecimals)} ${getDisplaySymbol(asset)}`}
        </Text>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsCloseAmount')}
        </Text>
        <Box
          backgroundColor={BoxBackgroundColor.BackgroundMuted}
          className="rounded-xl"
          padding={4}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            data-testid="close-amount-value"
          >
            {formatPerpsFiat(closeValueUsd, {
              ranges: PRICE_RANGES_MINIMAL_VIEW,
            })}
          </Text>
        </Box>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={4}
      >
        <Box
          className="min-w-0 flex-1"
          paddingHorizontal={1}
          data-testid="close-amount-slider"
        >
          <PerpsSlider
            min={0}
            max={100}
            step={1}
            value={closePercent}
            onChange={handleSliderChange}
          />
        </Box>
        <Box
          backgroundColor={BoxBackgroundColor.BackgroundMuted}
          className="rounded-lg"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          paddingHorizontal={2}
          paddingVertical={1}
          style={{
            width: `${CLOSE_PERCENT_CHIP_WIDTH_REM}rem`,
            flexShrink: 0,
          }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Center}
            style={{ width: '100%', fontVariantNumeric: 'tabular-nums' }}
          >
            {closePercent} %
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CloseAmountSection;
