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
import React, { useCallback, useMemo, useState } from 'react';
import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../../../../../shared/lib/perps-formatters';

import {
  BorderRadius,
  BackgroundColor,
  TextVariant as TextVariantLegacy,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { usePerpsOrderFees } from '../../../../../../hooks/perps/usePerpsOrderFees';
import { TextField, TextFieldSize } from '../../../../../component-library';
import ToggleButton from '../../../../../ui/toggle-button';
import type { AutoCloseSectionProps } from '../../order-entry.types';
import { isSignedDecimalInput, isUnsignedDecimalInput } from '../../utils';
import {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
  getTakeProfitErrorDirection,
  getStopLossErrorDirection,
} from '../../../utils/tpslValidation';
import { formatRoePercent, getPnlDisplayColor } from '../../../utils';

/**
 * AutoCloseSection - Collapsible section for Take Profit and Stop Loss configuration
 *
 * Features:
 * - Bidirectional input: Enter price ($) or percentage (%), the other updates automatically
 * - Preset percentage buttons for quick selection
 * - Direction-aware calculations (long vs short)
 * - RoE (Return on Equity) percentage: a leverage-adjusted percentage where
 * RoE% = priceChange% * leverage, matching mobile behavior
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
 * @param props.estimatedSize - Signed position size in asset units for estimated PnL
 * @param props.orderType - Order type ('market' | 'limit') for choosing the validation reference price
 * @param props.limitPrice - Limit price string used as reference price for limit-order TP/SL validation
 * @param props.leverage - Leverage multiplier for RoE% calculation
 * @param props.asset - Asset symbol for fetching dynamic closing fee rates
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
  estimatedSize,
  orderType,
  limitPrice,
  leverage,
  asset,
}) => {
  const t = useI18nContext();
  const { feeRate: closingFeeRate } = usePerpsOrderFees({
    symbol: asset,
    orderType: 'market',
  });

  // Priority: explicit entry price (modify mode) > limit price (limit orders) > current price.
  // This ensures % ↔ price conversions are anchored to the price the user will actually fill at.
  const entryPrice = useMemo(() => {
    if (entryPriceProp !== undefined) {
      return entryPriceProp;
    }
    if (orderType === 'limit' && limitPrice?.trim()) {
      const parsed = Number.parseFloat(limitPrice.replaceAll(/[$,]/gu, ''));
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return currentPrice;
  }, [entryPriceProp, orderType, limitPrice, currentPrice]);

  // Raw percent strings preserved while the user is actively typing in percent fields.
  // When focused, these strings are shown verbatim to prevent mid-keystroke reformatting.
  const [rawTpPercent, setRawTpPercent] = useState('');
  const [rawSlPercent, setRawSlPercent] = useState('');
  const [isTpPercentFocused, setIsTpPercentFocused] = useState(false);
  const [isSlPercentFocused, setIsSlPercentFocused] = useState(false);

  /**
   * Convert a target price to a signed RoE% for display.
   * Positive = profitable (above entry for long / below entry for short).
   * Negative = at a loss.
   * RoE% = ((targetPrice - entryPrice) / entryPrice) * leverage * 100
   */
  const priceToPercent = useCallback(
    (price: string): string => {
      if (!price || !entryPrice) {
        return '';
      }
      const priceNum = Number.parseFloat(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        return '';
      }

      const diff = priceNum - entryPrice;
      const percentChange = (diff / entryPrice) * leverage * 100;

      // For long: positive when price > entry (profit). For short: negate (profit when price < entry).
      return formatRoePercent(
        direction === 'long' ? percentChange : -percentChange,
      );
    },
    [entryPrice, leverage, direction],
  );

  /**
   * Convert a signed RoE% to a target price.
   * Positive percent = profitable direction (above entry for long / below entry for short).
   * Negative percent = loss direction.
   * targetPrice = entryPrice * (1 + signedRoe / (leverage * 100))  [long]
   * targetPrice = entryPrice * (1 - signedRoe / (leverage * 100))  [short]
   */
  const percentToPrice = useCallback(
    (percent: number): string => {
      if (!entryPrice || percent === 0) {
        return '';
      }

      const priceChangeRatio = percent / (leverage * 100);
      const multiplier =
        direction === 'long' ? 1 + priceChangeRatio : 1 - priceChangeRatio;

      const price = entryPrice * multiplier;
      const normalizedPrice = Number.parseFloat(price.toFixed(8));
      return Number.isFinite(normalizedPrice) && normalizedPrice > 0
        ? normalizedPrice.toString()
        : '';
    },
    [entryPrice, leverage, direction],
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
      if (value === '' || isUnsignedDecimalInput(value)) {
        onTakeProfitPriceChange(value);
      }
    },
    [onTakeProfitPriceChange],
  );

  const handleTpPriceBlur = useCallback(() => {
    if (!takeProfitPrice) {
      onTakeProfitPriceChange('');
      return;
    }

    const parsed = Number.parseFloat(takeProfitPrice);
    if (Number.isFinite(parsed) && parsed > 0) {
      onTakeProfitPriceChange(parsed.toString());
      return;
    }

    onTakeProfitPriceChange('');
  }, [onTakeProfitPriceChange, takeProfitPrice]);

  // Handle TP percentage input change
  const handleTpPercentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || isSignedDecimalInput(value)) {
        setRawTpPercent(value);
        const numValue = parseFloat(value);
        if (value === '' || value === '-' || value === '+') {
          onTakeProfitPriceChange('');
        } else if (!isNaN(numValue)) {
          const newPrice = percentToPrice(numValue);
          onTakeProfitPriceChange(newPrice);
        }
      }
    },
    [onTakeProfitPriceChange, percentToPrice],
  );

  const handleTpPercentFocus = useCallback(() => {
    // Seed raw value from current derived percent so the cursor lands on existing content
    const derived = priceToPercent(takeProfitPrice);
    setRawTpPercent(derived);
    setIsTpPercentFocused(true);
  }, [priceToPercent, takeProfitPrice]);

  const handleTpPercentBlur = useCallback(() => {
    setIsTpPercentFocused(false);
    setRawTpPercent('');
  }, []);

  // Handle SL price input change
  const handleSlPriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || isUnsignedDecimalInput(value)) {
        onStopLossPriceChange(value);
      }
    },
    [onStopLossPriceChange],
  );

  // Handle SL price blur - commit normalized value
  const handleSlPriceBlur = useCallback(() => {
    if (!stopLossPrice) {
      onStopLossPriceChange('');
      return;
    }

    const parsed = Number.parseFloat(stopLossPrice);
    if (Number.isFinite(parsed) && parsed > 0) {
      onStopLossPriceChange(parsed.toString());
      return;
    }

    onStopLossPriceChange('');
  }, [onStopLossPriceChange, stopLossPrice]);

  // Handle SL percentage input change
  const handleSlPercentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || isSignedDecimalInput(value)) {
        setRawSlPercent(value);
        const numValue = parseFloat(value);
        if (value === '' || value === '-' || value === '+') {
          onStopLossPriceChange('');
        } else if (!isNaN(numValue)) {
          const newPrice = percentToPrice(numValue);
          onStopLossPriceChange(newPrice);
        }
      }
    },
    [onStopLossPriceChange, percentToPrice],
  );

  const handleSlPercentFocus = useCallback(() => {
    const derived = priceToPercent(stopLossPrice);
    setRawSlPercent(derived);
    setIsSlPercentFocused(true);
  }, [priceToPercent, stopLossPrice]);

  const handleSlPercentBlur = useCallback(() => {
    setIsSlPercentFocused(false);
    setRawSlPercent('');
  }, []);

  // Calculate current RoE percentages for display (used when fields are not focused)
  const tpPercent = useMemo(
    () => priceToPercent(takeProfitPrice),
    [priceToPercent, takeProfitPrice],
  );

  const slPercent = useMemo(
    () => priceToPercent(stopLossPrice),
    [priceToPercent, stopLossPrice],
  );

  const isLimitWithPrice = orderType === 'limit' && Boolean(limitPrice?.trim());
  const validationReferencePrice = useMemo(() => {
    if (isLimitWithPrice && limitPrice) {
      const parsed = Number.parseFloat(limitPrice.replaceAll(/[$,]/gu, ''));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : currentPrice;
    }
    return currentPrice;
  }, [isLimitWithPrice, limitPrice, currentPrice]);

  const pnlEntryPrice = isLimitWithPrice
    ? validationReferencePrice
    : entryPrice;

  const estimatedPnlAtTp = useMemo(() => {
    if (
      !estimatedSize ||
      !takeProfitPrice ||
      !pnlEntryPrice ||
      closingFeeRate === undefined
    ) {
      return null;
    }
    const exitPrice = Number.parseFloat(takeProfitPrice);
    if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
      return null;
    }
    const grossPnl = estimatedSize * (exitPrice - pnlEntryPrice);
    const closingFee = Math.abs(estimatedSize) * exitPrice * closingFeeRate;
    return grossPnl - closingFee;
  }, [estimatedSize, takeProfitPrice, pnlEntryPrice, closingFeeRate]);

  const estimatedPnlAtSl = useMemo(() => {
    if (
      !estimatedSize ||
      !stopLossPrice ||
      !pnlEntryPrice ||
      closingFeeRate === undefined
    ) {
      return null;
    }
    const exitPrice = Number.parseFloat(stopLossPrice);
    if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
      return null;
    }
    const grossPnl = estimatedSize * (exitPrice - pnlEntryPrice);
    const closingFee = Math.abs(estimatedSize) * exitPrice * closingFeeRate;
    return grossPnl - closingFee;
  }, [estimatedSize, stopLossPrice, pnlEntryPrice, closingFeeRate]);

  const priceLabel = isLimitWithPrice ? 'entry' : 'current';

  const isTpInvalid = useMemo(
    () =>
      Boolean(
        takeProfitPrice.trim() &&
          validationReferencePrice > 0 &&
          !isValidTakeProfitPrice(takeProfitPrice, {
            currentPrice: validationReferencePrice,
            direction,
          }),
      ),
    [takeProfitPrice, validationReferencePrice, direction],
  );

  const isSlInvalid = useMemo(
    () =>
      Boolean(
        stopLossPrice.trim() &&
          validationReferencePrice > 0 &&
          !isValidStopLossPrice(stopLossPrice, {
            currentPrice: validationReferencePrice,
            direction,
          }),
      ),
    [stopLossPrice, validationReferencePrice, direction],
  );

  const tpErrorMessage = useMemo(() => {
    if (!isTpInvalid) {
      return null;
    }
    return t('perpsTakeProfitInvalidPrice', [
      getTakeProfitErrorDirection(direction),
      priceLabel,
    ]);
  }, [isTpInvalid, direction, priceLabel, t]);

  const slErrorMessage = useMemo(() => {
    if (!isSlInvalid) {
      return null;
    }
    return t('perpsStopLossInvalidPrice', [
      getStopLossErrorDirection(direction),
      priceLabel,
    ]);
  }, [isSlInvalid, direction, priceLabel, t]);

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
                  value={takeProfitPrice}
                  onChange={handleTpPriceChange}
                  onBlur={handleTpPriceBlur}
                  placeholder="0.00"
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
                  value={isTpPercentFocused ? rawTpPercent : tpPercent}
                  onChange={handleTpPercentChange}
                  onFocus={handleTpPercentFocus}
                  onBlur={handleTpPercentBlur}
                  placeholder="0"
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
            {(Boolean(takeProfitPrice.trim()) || estimatedPnlAtTp !== null) && (
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                data-testid="auto-close-estimated-tp-pnl-row"
              >
                {takeProfitPrice.trim() ? (
                  <button
                    type="button"
                    className="cursor-pointer bg-transparent border-none p-0"
                    onClick={() => onTakeProfitPriceChange('')}
                    data-testid="tp-clear-button"
                  >
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.PrimaryDefault}
                    >
                      {t('clear')}
                    </Text>
                  </button>
                ) : (
                  <Box />
                )}
                {estimatedPnlAtTp !== null && (
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    gap={1}
                  >
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsEstimatedPnlAtTakeProfit')}
                    </Text>
                    <Text
                      variant={TextVariant.BodyXs}
                      fontWeight={FontWeight.Medium}
                      color={getPnlDisplayColor(estimatedPnlAtTp)}
                    >
                      {estimatedPnlAtTp >= 0 ? '+' : '-'}
                      {formatPerpsFiat(Math.abs(estimatedPnlAtTp), {
                        ranges: PRICE_RANGES_MINIMAL_VIEW,
                      })}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
            {tpErrorMessage && (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.ErrorDefault}
                data-testid="tp-validation-error"
              >
                {tpErrorMessage}
              </Text>
            )}
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
                  value={stopLossPrice}
                  onChange={handleSlPriceChange}
                  onBlur={handleSlPriceBlur}
                  placeholder="0.00"
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
                  value={isSlPercentFocused ? rawSlPercent : slPercent}
                  onChange={handleSlPercentChange}
                  onFocus={handleSlPercentFocus}
                  onBlur={handleSlPercentBlur}
                  placeholder="0"
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
            {(Boolean(stopLossPrice.trim()) || estimatedPnlAtSl !== null) && (
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                data-testid="auto-close-estimated-sl-pnl-row"
              >
                {stopLossPrice.trim() ? (
                  <button
                    type="button"
                    className="cursor-pointer bg-transparent border-none p-0"
                    onClick={() => onStopLossPriceChange('')}
                    data-testid="sl-clear-button"
                  >
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.PrimaryDefault}
                    >
                      {t('clear')}
                    </Text>
                  </button>
                ) : (
                  <Box />
                )}
                {estimatedPnlAtSl !== null && (
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    gap={1}
                  >
                    <Text
                      variant={TextVariant.BodyXs}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsEstimatedPnlAtStopLoss')}
                    </Text>
                    <Text
                      variant={TextVariant.BodyXs}
                      fontWeight={FontWeight.Medium}
                      color={getPnlDisplayColor(estimatedPnlAtSl)}
                    >
                      {estimatedPnlAtSl >= 0 ? '+' : '-'}
                      {formatPerpsFiat(Math.abs(estimatedPnlAtSl), {
                        ranges: PRICE_RANGES_MINIMAL_VIEW,
                      })}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
            {slErrorMessage && (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.ErrorDefault}
                data-testid="sl-validation-error"
              >
                {slErrorMessage}
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AutoCloseSection;
