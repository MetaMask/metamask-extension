import React, { useCallback, useState } from 'react';
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
import ToggleButton from '../../../../../ui/toggle-button';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
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
  const [tpUnit, setTpUnit] = useState<TPSLUnit>('percent');
  const [slUnit, setSlUnit] = useState<TPSLUnit>('percent');

  // Calculate gain/loss based on price and direction
  const calculateGainLoss = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !currentPrice) {
        return '';
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        return '';
      }

      const diff = priceNum - currentPrice;
      const percentChange = (diff / currentPrice) * 100;

      // For long: TP is above entry (positive), SL is below entry (negative)
      // For short: TP is below entry (negative gain = profit), SL is above entry
      if (direction === 'long') {
        return isTP
          ? percentChange.toFixed(2)
          : Math.abs(percentChange).toFixed(2);
      }
      return isTP
        ? Math.abs(percentChange).toFixed(2)
        : percentChange.toFixed(2);
    },
    [currentPrice, direction],
  );

  const handleToggle = useCallback(
    (value: boolean) => {
      onEnabledChange(!value);
    },
    [onEnabledChange],
  );

  const handleTpPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        onTakeProfitPriceChange(value);
      }
    },
    [onTakeProfitPriceChange],
  );

  const handleSlPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        onStopLossPriceChange(value);
      }
    },
    [onStopLossPriceChange],
  );

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
                placeholder={t('perpsTpPrice')}
                className="w-full"
                data-testid="tp-price-input"
              />
            </Box>

            {/* Gain Input (read-only display) */}
            <Box className="flex-1">
              <TextField
                size={TextFieldSize.Md}
                value={calculateGainLoss(takeProfitPrice, true)}
                placeholder={t('perpsGain')}
                className="w-full"
                readOnly
                data-testid="tp-gain-input"
              />
            </Box>

            {/* Unit Toggle */}
            <ButtonBase
              onClick={toggleTpUnit}
              className={twMerge(
                'px-3 py-2 rounded-lg bg-muted',
                'hover:bg-muted-hover active:bg-muted-pressed',
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
                placeholder={t('perpsSlPrice')}
                className="w-full"
                data-testid="sl-price-input"
              />
            </Box>

            {/* Loss Input (read-only display) */}
            <Box className="flex-1">
              <TextField
                size={TextFieldSize.Md}
                value={calculateGainLoss(stopLossPrice, false)}
                placeholder={t('perpsLoss')}
                className="w-full"
                readOnly
                data-testid="sl-loss-input"
              />
            </Box>

            {/* Unit Toggle */}
            <ButtonBase
              onClick={toggleSlUnit}
              className={twMerge(
                'px-3 py-2 rounded-lg bg-muted',
                'hover:bg-muted-hover active:bg-muted-pressed',
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
