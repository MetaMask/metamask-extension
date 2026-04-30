import React, { useCallback, useMemo, useState } from 'react';
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
import { formatPositionSize } from '../../../../../../../shared/lib/perps-formatters';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { TextField, TextFieldSize } from '../../../../../component-library';
import { PerpsSlider } from '../../../perps-slider';
import { getDisplaySymbol } from '../../../utils';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { CloseAmountSectionProps } from '../../order-entry.types';
import { isUnsignedDecimalInput, formatNumberForInput } from '../../utils';

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

  const totalPositionSize = Math.abs(Number.parseFloat(positionSize)) || 0;
  const totalNotionalUsd = totalPositionSize * currentPrice;

  const closeValueUsd = useMemo(
    () => (totalNotionalUsd * closePercent) / 100,
    [totalNotionalUsd, closePercent],
  );

  const [rawInput, setRawInput] = useState('');
  const [isUsdInputFocused, setIsUsdInputFocused] = useState(false);

  const displayValue = useMemo(
    () => formatNumberForInput(closeValueUsd, 2),
    [closeValueUsd],
  );

  const handleUsdInputChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      if (value === '' || isUnsignedDecimalInput(value)) {
        setRawInput(value);

        const parsed = Number.parseFloat(value);
        if (!Number.isNaN(parsed) && totalNotionalUsd > 0) {
          const newPercent = Math.min(
            100,
            Math.max(0, (parsed / totalNotionalUsd) * 100),
          );
          onClosePercentChange(newPercent);
        } else if (value === '' || value === '0') {
          onClosePercentChange(0);
        }
      }
    },
    [totalNotionalUsd, onClosePercentChange],
  );

  const handleUsdInputFocus = useCallback(() => {
    setIsUsdInputFocused(true);
    setRawInput(formatNumberForInput(closeValueUsd, 2));
  }, [closeValueUsd]);

  const handleUsdInputBlur = useCallback(() => {
    setIsUsdInputFocused(false);
  }, []);

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const percent = Array.isArray(value) ? value[0] : value;
      onClosePercentChange(percent);
    },
    [onClosePercentChange],
  );

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
        <TextField
          size={TextFieldSize.Md}
          value={isUsdInputFocused ? rawInput : displayValue}
          onChange={handleUsdInputChange}
          onFocus={handleUsdInputFocus}
          onBlur={handleUsdInputBlur}
          placeholder="0.00"
          borderRadius={BorderRadius.MD}
          borderWidth={0}
          backgroundColor={BackgroundColor.backgroundMuted}
          className="w-full"
          data-testid="close-amount-value"
          inputProps={{ inputMode: 'decimal' }}
          startAccessory={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              $
            </Text>
          }
        />
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
            {Math.round(closePercent)} %
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CloseAmountSection;
