import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
} from '@metamask/design-system-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import {
  BorderRadius,
  BackgroundColor,
  TextVariant as TextVariantLegacy,
} from '../../../../../../helpers/constants/design-system';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../../../component-library';
import ToggleButton from '../../../../../ui/toggle-button';
import { normalizeLocalizedNumberInput } from '../../../utils/localeNumber';
import type { AutoCloseSectionProps } from '../../order-entry.types';

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
  const locale = useSelector(getIntlLocale);
  const [isTpFocused, setIsTpFocused] = useState(false);
  const [isSlFocused, setIsSlFocused] = useState(false);
  const [tpInputValue, setTpInputValue] = useState('');
  const [slInputValue, setSlInputValue] = useState('');

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

  const formatStoredPriceForDisplay = useCallback(
    (value: string): string => {
      if (!value) {
        return '';
      }

      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return '';
      }

      return formatPrice(parsed);
    },
    [formatPrice],
  );

  const formattedTakeProfitPrice = useMemo(
    () => formatStoredPriceForDisplay(takeProfitPrice),
    [formatStoredPriceForDisplay, takeProfitPrice],
  );

  const formattedStopLossPrice = useMemo(
    () => formatStoredPriceForDisplay(stopLossPrice),
    [formatStoredPriceForDisplay, stopLossPrice],
  );

  useEffect(() => {
    if (!isTpFocused) {
      setTpInputValue(formattedTakeProfitPrice);
    }
  }, [formattedTakeProfitPrice, isTpFocused]);

  useEffect(() => {
    if (!isSlFocused) {
      setSlInputValue(formattedStopLossPrice);
    }
  }, [formattedStopLossPrice, isSlFocused]);

  // Calculate percentage from price
  const priceToPercent = useCallback(
    (price: string, isTP: boolean): string => {
      if (!price || !entryPrice) {
        return '';
      }
      const priceNum = Number.parseFloat(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
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
      return price.toFixed(2);
    },
    [entryPrice, direction],
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
      const canonicalDraft = normalizeLocalizedNumberInput(value, locale, {
        allowTrailingDecimal: true,
      });

      if (canonicalDraft === null) {
        return;
      }

      setTpInputValue(value);
      onTakeProfitPriceChange(canonicalDraft);
    },
    [locale, onTakeProfitPriceChange],
  );

  const handleTpPriceFocus = useCallback(() => {
    setIsTpFocused(true);
    setTpInputValue(formattedTakeProfitPrice);
  }, [formattedTakeProfitPrice]);

  const handleTpPriceBlur = useCallback(() => {
    setIsTpFocused(false);

    if (!takeProfitPrice) {
      onTakeProfitPriceChange('');
      return;
    }

    const parsed = Number.parseFloat(takeProfitPrice);
    if (Number.isFinite(parsed) && parsed > 0) {
      onTakeProfitPriceChange(parsed.toFixed(2));
      return;
    }

    onTakeProfitPriceChange('');
  }, [onTakeProfitPriceChange, takeProfitPrice]);

  // Handle TP percentage input change
  const handleTpPercentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
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
      const canonicalDraft = normalizeLocalizedNumberInput(value, locale, {
        allowTrailingDecimal: true,
      });

      if (canonicalDraft === null) {
        return;
      }

      setSlInputValue(value);
      onStopLossPriceChange(canonicalDraft);
    },
    [locale, onStopLossPriceChange],
  );

  const handleSlPriceFocus = useCallback(() => {
    setIsSlFocused(true);
    setSlInputValue(formattedStopLossPrice);
  }, [formattedStopLossPrice]);

  // Handle SL price blur - commit canonical value
  const handleSlPriceBlur = useCallback(() => {
    setIsSlFocused(false);

    if (!stopLossPrice) {
      onStopLossPriceChange('');
      return;
    }

    const parsed = Number.parseFloat(stopLossPrice);
    if (Number.isFinite(parsed) && parsed > 0) {
      onStopLossPriceChange(parsed.toFixed(2));
      return;
    }

    onStopLossPriceChange('');
  }, [onStopLossPriceChange, stopLossPrice]);

  // Handle SL percentage input change
  const handleSlPercentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^-?\d*(?:\.\d*)?$/u.test(value)) {
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

  // Calculate current percentages for display
  const tpPercent = useMemo(
    () => priceToPercent(takeProfitPrice, true),
    [priceToPercent, takeProfitPrice],
  );

  const slPercent = useMemo(
    () => priceToPercent(stopLossPrice, false),
    [priceToPercent, stopLossPrice],
  );

  const pricePlaceholder = useMemo(() => formatPrice(0), [formatPrice]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={3}>
      {/* Toggle Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
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
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
              fontWeight={FontWeight.Regular}
            >
              {t('perpsTakeProfit')}
            </Text>

            {/* Input Row: Price ($) left, Percent (%) right */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={2}
              alignItems={BoxAlignItems.Center}
            >
              {/* TP Price Input */}
              <Box className="flex-1">
                <TextField
                  size={TextFieldSize.Sm}
                  value={isTpFocused ? tpInputValue : formattedTakeProfitPrice}
                  onChange={handleTpPriceChange}
                  onFocus={handleTpPriceFocus}
                  onBlur={handleTpPriceBlur}
                  placeholder={pricePlaceholder}
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="tp-price-input"
                  inputProps={{
                    textVariant: TextVariantLegacy.bodySm,
                    inputMode: 'decimal',
                  }}
                  startAccessory={
                    <Text
                      variant={TextVariant.BodySm}
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
                  size={TextFieldSize.Sm}
                  value={tpPercent}
                  onChange={handleTpPercentChange}
                  placeholder="0.0"
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="tp-percent-input"
                  inputProps={{ textVariant: TextVariantLegacy.bodySm }}
                  endAccessory={
                    <Text
                      variant={TextVariant.BodySm}
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
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
              fontWeight={FontWeight.Regular}
            >
              {t('perpsStopLoss')}
            </Text>

            {/* Input Row: Price ($) left, Percent (%) right */}
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={2}
              alignItems={BoxAlignItems.Center}
            >
              {/* SL Price Input */}
              <Box className="flex-1">
                <TextField
                  size={TextFieldSize.Sm}
                  value={isSlFocused ? slInputValue : formattedStopLossPrice}
                  onChange={handleSlPriceChange}
                  onFocus={handleSlPriceFocus}
                  onBlur={handleSlPriceBlur}
                  placeholder={pricePlaceholder}
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="sl-price-input"
                  inputProps={{
                    textVariant: TextVariantLegacy.bodySm,
                    inputMode: 'decimal',
                  }}
                  startAccessory={
                    <Text
                      variant={TextVariant.BodySm}
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
                  size={TextFieldSize.Sm}
                  value={slPercent}
                  onChange={handleSlPercentChange}
                  placeholder="0.0"
                  borderRadius={BorderRadius.MD}
                  borderWidth={0}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  className="w-full"
                  data-testid="sl-percent-input"
                  inputProps={{ textVariant: TextVariantLegacy.bodySm }}
                  endAccessory={
                    <Text
                      variant={TextVariant.BodySm}
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
