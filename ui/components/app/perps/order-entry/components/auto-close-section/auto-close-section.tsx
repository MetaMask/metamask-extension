import React, { useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import { TextField, TextFieldSize } from '../../../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import ToggleButton from '../../../../../ui/toggle-button';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import type { AutoCloseSectionProps } from '../../order-entry.types';

// Preset percentage options for quick selection
const TP_PRESETS = [10, 25, 50, 100];
const SL_PRESETS = [10, 25, 50, 75];

/**
 * AutoCloseSection - Collapsible section for Take Profit and Stop Loss configuration
 *
 * Features:
 * - Bidirectional input: Enter price ($) or percentage (%), the other updates automatically
 * - Preset percentage buttons for quick selection
 * - Direction-aware calculations (long vs short)
 *
 * @param props - Component props
 * @param props.enabled - Whether auto-close is enabled
 * @param props.onEnabledChange - Callback when enabled state changes
 * @param props.takeProfitPrice - Take profit price
 * @param props.onTakeProfitPriceChange - Callback when TP price changes
 * @param props.stopLossPrice - Stop loss price
 * @param props.onStopLossPriceChange - Callback when SL price changes
 * @param props.direction - Current order direction
 * @param props.currentPrice - Current asset price (used as entry price for new orders)
 * @param props.entryPrice - Position entry price (modify mode - use for accurate % calc)
 */
export const AutoCloseSection: React.FC<AutoCloseSectionProps> = ({
  enabled,
  onEnabledChange,
  takeProfitPrice,
  onTakeProfitPriceChange,
  stopLossPrice,
  onStopLossPriceChange,
  direction,
  currentPrice,
  entryPrice: entryPriceProp,
}) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();

  // In modify mode use position's entry price; otherwise use current price
  const entryPrice = entryPriceProp ?? currentPrice;

  // Format price for display (with locale-aware formatting)
  const formatPrice = useCallback(
    (value: number): string => {
      return formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [formatNumber],
  );

  // Format percentage for display
  const formatPercent = useCallback(
    (value: number): string => {
      return formatNumber(value, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    },
    [formatNumber],
  );

  // Calculate percentage from price
  const priceToPercent = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !entryPrice) {
        return '';
      }
      const cleanPrice = price.replace(/,/gu, '');
      const priceNum = parseFloat(cleanPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        return '';
      }

      const diff = priceNum - entryPrice;
      const percentChange = (diff / entryPrice) * 100;

      // For long: TP is above entry (positive %), SL is below entry (show as positive loss %)
      // For short: TP is below entry (show as positive profit %), SL is above entry (show as positive loss %)
      if (direction === 'long') {
        return formatPercent(isTP ? percentChange : -percentChange);
      }
      return formatPercent(isTP ? -percentChange : percentChange);
    },
    [entryPrice, direction, formatPercent],
  );

  // Calculate price from percentage
  const percentToPrice = useCallback(
    (percent: number, isTP: boolean): string => {
      if (!entryPrice || percent === 0) {
        return '';
      }

      // For long: TP = entry * (1 + %), SL = entry * (1 - %)
      // For short: TP = entry * (1 - %), SL = entry * (1 + %)
      let multiplier: number;
      if (direction === 'long') {
        multiplier = isTP ? 1 + percent / 100 : 1 - percent / 100;
      } else {
        multiplier = isTP ? 1 - percent / 100 : 1 + percent / 100;
      }

      const price = entryPrice * multiplier;
      return formatPrice(price);
    },
    [entryPrice, direction, formatPrice],
  );

  const handleToggle = useCallback(
    (value: boolean) => {
      onEnabledChange(!value);
    },
    [onEnabledChange],
  );

  // Handle TP price input change
  const handleTpPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onTakeProfitPriceChange(value);
      }
    },
    [onTakeProfitPriceChange],
  );

  // Handle TP price blur - format the value
  const handleTpPriceBlur = useCallback(() => {
    if (takeProfitPrice) {
      const numValue = parseFloat(takeProfitPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onTakeProfitPriceChange(formatPrice(numValue));
      }
    }
  }, [takeProfitPrice, onTakeProfitPriceChange, formatPrice]);

  // Handle TP percentage input change
  const handleTpPercentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*\.?\d*$/u.test(value)) {
        const numValue = parseFloat(value);
        if (value === '' || value === '-') {
          onTakeProfitPriceChange('');
        } else if (!isNaN(numValue)) {
          const newPrice = percentToPrice(numValue, true);
          onTakeProfitPriceChange(newPrice);
        }
      }
    },
    [onTakeProfitPriceChange, percentToPrice],
  );

  // Handle SL price input change
  const handleSlPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onStopLossPriceChange(value);
      }
    },
    [onStopLossPriceChange],
  );

  // Handle SL price blur - format the value
  const handleSlPriceBlur = useCallback(() => {
    if (stopLossPrice) {
      const numValue = parseFloat(stopLossPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onStopLossPriceChange(formatPrice(numValue));
      }
    }
  }, [stopLossPrice, onStopLossPriceChange, formatPrice]);

  // Handle SL percentage input change
  const handleSlPercentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*\.?\d*$/u.test(value)) {
        const numValue = parseFloat(value);
        if (value === '' || value === '-') {
          onStopLossPriceChange('');
        } else if (!isNaN(numValue)) {
          const newPrice = percentToPrice(numValue, false);
          onStopLossPriceChange(newPrice);
        }
      }
    },
    [onStopLossPriceChange, percentToPrice],
  );

  // Handle preset button click for TP
  const handleTpPreset = useCallback(
    (percent: number) => {
      const newPrice = percentToPrice(percent, true);
      onTakeProfitPriceChange(newPrice);
    },
    [percentToPrice, onTakeProfitPriceChange],
  );

  // Handle preset button click for SL
  const handleSlPreset = useCallback(
    (percent: number) => {
      const newPrice = percentToPrice(percent, false);
      onStopLossPriceChange(newPrice);
    },
    [percentToPrice, onStopLossPriceChange],
  );

  // Calculate current percentages for display
  const tpPercent = useMemo(
    () => priceToPercent(takeProfitPrice, true),
    [priceToPercent, takeProfitPrice],
  );

  const slPercent = useMemo(
    () => priceToPercent(stopLossPrice, false),
    [priceToPercent, stopLossPrice],
  );

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Toggle Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          {t('perpsAutoClose')}
        </Text>
        <ToggleButton
          value={enabled}
          onToggle={handleToggle}
          dataTestId="auto-close-toggle"
        />
      </Box>

      {/* TP/SL Inputs - shown when enabled */}
      {enabled && (
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          {/* Take Profit Section */}
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsTakeProfit')}
            </Text>

            {/* Preset Buttons */}
            <Box flexDirection={BoxFlexDirection.Row} gap={2}>
              {TP_PRESETS.map((preset) => (
                <Button
                  key={`tp-${preset}`}
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  onClick={() => handleTpPreset(preset)}
                  className={twMerge('flex-1', 'rounded-md')}
                  data-testid={`tp-preset-${preset}`}
                >
                  +{preset}%
                </Button>
              ))}
            </Box>

            {/* Input Row: Price ($) left, Percent (%) right */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={2}
              alignItems={BoxAlignItems.Center}
            >
              {/* TP Price Input */}
              <Box className="flex-1">
                <TextField
                  size={TextFieldSize.Md}
                  value={takeProfitPrice}
                  onChange={handleTpPriceChange}
                  onBlur={handleTpPriceBlur}
                  placeholder="0.00"
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="tp-price-input"
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

              {/* TP Percent Input */}
              <Box className="flex-1">
                <TextField
                  size={TextFieldSize.Md}
                  value={tpPercent}
                  onChange={handleTpPercentChange}
                  placeholder="0.0"
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="tp-percent-input"
                  endAccessory={
                    <Text
                      variant={TextVariant.BodyMd}
                      color={TextColor.TextAlternative}
                    >
                      %
                    </Text>
                  }
                />
              </Box>
            </Box>
          </Box>

          {/* Stop Loss Section */}
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              fontWeight={FontWeight.Medium}
            >
              {t('perpsStopLoss')}
            </Text>

            {/* Preset Buttons */}
            <Box flexDirection={BoxFlexDirection.Row} gap={2}>
              {SL_PRESETS.map((preset) => (
                <Button
                  key={`sl-${preset}`}
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  onClick={() => handleSlPreset(preset)}
                  className={twMerge('flex-1', 'rounded-md')}
                  data-testid={`sl-preset-${preset}`}
                >
                  -{preset}%
                </Button>
              ))}
            </Box>

            {/* Input Row: Price ($) left, Percent (%) right */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={2}
              alignItems={BoxAlignItems.Center}
            >
              {/* SL Price Input */}
              <Box className="flex-1">
                <TextField
                  size={TextFieldSize.Md}
                  value={stopLossPrice}
                  onChange={handleSlPriceChange}
                  onBlur={handleSlPriceBlur}
                  placeholder="0.00"
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="sl-price-input"
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

              {/* SL Percent Input */}
              <Box className="flex-1">
                <TextField
                  size={TextFieldSize.Md}
                  value={slPercent}
                  onChange={handleSlPercentChange}
                  placeholder="0.0"
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="sl-percent-input"
                  endAccessory={
                    <Text
                      variant={TextVariant.BodyMd}
                      color={TextColor.TextAlternative}
                    >
                      %
                    </Text>
                  }
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AutoCloseSection;
