import React, { useCallback, useMemo, useState } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonBase,
} from '@metamask/design-system-react';
import { TextField, TextFieldSize } from '../../../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import ToggleButton from '../../../../../ui/toggle-button';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import type { AutoCloseSectionProps, TPSLUnit } from '../../order-entry.types';

/**
 * AutoCloseSection - Collapsible section for Take Profit and Stop Loss configuration
 *
 * @param props - Component props
 * @param props.enabled - Whether auto-close is enabled
 * @param props.onEnabledChange - Callback when enabled state changes
 * @param props.takeProfitPrice - Take profit price
 * @param props.onTakeProfitPriceChange - Callback when TP price changes
 * @param props.stopLossPrice - Stop loss price
 * @param props.onStopLossPriceChange - Callback when SL price changes
 * @param props.direction - Current order direction
 * @param props.currentPrice - Current asset price
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
}) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();
  const [tpUnit, setTpUnit] = useState<TPSLUnit>('percent');
  const [slUnit, setSlUnit] = useState<TPSLUnit>('percent');

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

  // Formatted placeholder for the price inputs
  const formattedPlaceholder = useMemo(() => formatPrice(0), [formatPrice]);

  // Calculate gain/loss based on price and direction
  const calculateGainLoss = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !currentPrice) {
        return '';
      }
      // Remove commas from formatted price for parsing
      const cleanPrice = price.replace(/,/gu, '');
      const priceNum = parseFloat(cleanPrice);
      if (isNaN(priceNum)) {
        return '';
      }

      const diff = priceNum - currentPrice;
      const percentChange = (diff / currentPrice) * 100;

      // For long: TP is above entry (positive), SL is below entry (negative)
      // For short: TP is below entry (negative gain = profit), SL is above entry
      let value: number;
      if (direction === 'long') {
        value = isTP ? percentChange : Math.abs(percentChange);
      } else {
        value = isTP ? Math.abs(percentChange) : percentChange;
      }
      return formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [currentPrice, direction, formatNumber],
  );

  const handleToggle = useCallback(
    (value: boolean) => {
      onEnabledChange(!value);
    },
    [onEnabledChange],
  );

  const handleTpPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      // Allow empty string, valid numbers, or numbers with commas (for formatted input)
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onTakeProfitPriceChange(value);
      }
    },
    [onTakeProfitPriceChange],
  );

  // Handle blur - format the TP price when user finishes typing
  const handleTpPriceBlur = useCallback(() => {
    if (takeProfitPrice) {
      const numValue = parseFloat(takeProfitPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onTakeProfitPriceChange(formatPrice(numValue));
      }
    }
  }, [takeProfitPrice, onTakeProfitPriceChange, formatPrice]);

  const handleSlPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      // Allow empty string, valid numbers, or numbers with commas (for formatted input)
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onStopLossPriceChange(value);
      }
    },
    [onStopLossPriceChange],
  );

  // Handle blur - format the SL price when user finishes typing
  const handleSlPriceBlur = useCallback(() => {
    if (stopLossPrice) {
      const numValue = parseFloat(stopLossPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onStopLossPriceChange(formatPrice(numValue));
      }
    }
  }, [stopLossPrice, onStopLossPriceChange, formatPrice]);

  const toggleTpUnit = useCallback(() => {
    setTpUnit((prev) => (prev === 'percent' ? 'usd' : 'percent'));
  }, []);

  const toggleSlUnit = useCallback(() => {
    setSlUnit((prev) => (prev === 'percent' ? 'usd' : 'percent'));
  }, []);

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
        <Box flexDirection={BoxFlexDirection.Column} gap={3}>
          {/* Take Profit Row */}
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
                placeholder={formattedPlaceholder}
                borderRadius={BorderRadius.MD}
                borderWidth={0}
                backgroundColor={BackgroundColor.backgroundMuted}
                className="w-full"
                data-testid="tp-price-input"
              />
            </Box>

            {/* Gain Input (read-only display) */}
            <Box className="flex-1">
              <TextField
                size={TextFieldSize.Md}
                value={calculateGainLoss(takeProfitPrice, true)}
                placeholder={formattedPlaceholder}
                borderRadius={BorderRadius.MD}
                borderWidth={0}
                backgroundColor={BackgroundColor.backgroundMuted}
                className="w-full"
                readOnly
                data-testid="tp-gain-input"
              />
            </Box>

            {/* Unit Toggle */}
            <ButtonBase
              onClick={toggleTpUnit}
              className={twMerge(
                'px-3 h-10 rounded-lg bg-muted',
                'hover:bg-hover active:bg-pressed',
                'min-w-[50px]',
              )}
              data-testid="tp-unit-toggle"
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {tpUnit === 'percent' ? '%' : '$'} ▾
              </Text>
            </ButtonBase>
          </Box>

          {/* Stop Loss Row */}
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
                placeholder={formattedPlaceholder}
                borderRadius={BorderRadius.MD}
                borderWidth={0}
                backgroundColor={BackgroundColor.backgroundMuted}
                className="w-full"
                data-testid="sl-price-input"
              />
            </Box>

            {/* Loss Input (read-only display) */}
            <Box className="flex-1">
              <TextField
                size={TextFieldSize.Md}
                value={calculateGainLoss(stopLossPrice, false)}
                placeholder={formattedPlaceholder}
                borderRadius={BorderRadius.MD}
                borderWidth={0}
                backgroundColor={BackgroundColor.backgroundMuted}
                className="w-full"
                readOnly
                data-testid="sl-loss-input"
              />
            </Box>

            {/* Unit Toggle */}
            <ButtonBase
              onClick={toggleSlUnit}
              className={twMerge(
                'px-3 h-10 rounded-lg bg-muted',
                'hover:bg-hover active:bg-pressed',
                'min-w-[50px]',
              )}
              data-testid="sl-unit-toggle"
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {slUnit === 'percent' ? '%' : '$'} ▾
              </Text>
            </ButtonBase>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AutoCloseSection;
