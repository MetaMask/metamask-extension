import React, { useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
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
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';
import type { OrderDirection } from '../../order-entry.types';

/**
 * Props for LimitPriceInput component
 */
export type LimitPriceInputProps = {
  /** Current limit price value */
  limitPrice: string;
  /** Callback when limit price changes */
  onLimitPriceChange: (price: string) => void;
  /** Current market price (fallback for presets when bid/ask not available) */
  currentPrice: number;
  /** Order direction - affects which presets are shown */
  direction: OrderDirection;
  /** Mid price from top-of-book (optional, falls back to currentPrice) */
  midPrice?: number;
  /** Best bid price from top-of-book (optional, falls back to currentPrice) */
  bidPrice?: number;
  /** Best ask price from top-of-book (optional, falls back to currentPrice) */
  askPrice?: number;
};

/**
 * LimitPriceInput - Price input with direction-aware preset buttons for limit orders
 *
 * Features:
 * - Dollar-prefixed price input with decimal validation
 * - Direction-aware presets:
 * - Long: Mid, Bid, -1%, -2% (prices at or below market)
 * - Short: Mid, Ask, +1%, +2% (prices at or above market)
 * - Format on blur (2 decimal places)
 *
 * This component is a pure presentational component — it does not subscribe
 * to any controller or provider internally. Reference prices (mid, bid, ask)
 * should be passed in as props by the parent page that manages the controller.
 *
 * @param props - Component props
 * @param props.limitPrice - Current limit price value
 * @param props.onLimitPriceChange - Callback when limit price changes
 * @param props.currentPrice - Current market price (fallback)
 * @param props.direction - Order direction (long/short)
 * @param props.midPrice - Mid price from orderbook
 * @param props.bidPrice - Best bid price from orderbook
 * @param props.askPrice - Best ask price from orderbook
 */
export const LimitPriceInput: React.FC<LimitPriceInputProps> = ({
  limitPrice,
  onLimitPriceChange,
  currentPrice,
  direction,
  midPrice: midPriceProp,
  bidPrice: bidPriceProp,
  askPrice: askPriceProp,
}) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();

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

  // Use provided reference prices or fall back to currentPrice
  const midPrice = midPriceProp ?? currentPrice;
  const bidPrice = bidPriceProp ?? currentPrice;
  const askPrice = askPriceProp ?? currentPrice;

  // Direction-aware presets
  // Long: Mid, Bid, -1%, -2% (buy below market)
  // Short: Mid, Ask, +1%, +2% (sell above market)
  const presets = useMemo(() => {
    if (direction === 'long') {
      return [
        { label: t('perpsMid'), value: midPrice },
        { label: t('perpsBid'), value: bidPrice },
        { label: '-1%', value: midPrice * 0.99 },
        { label: '-2%', value: midPrice * 0.98 },
      ];
    }
    return [
      { label: t('perpsMid'), value: midPrice },
      { label: t('perpsAsk'), value: askPrice },
      { label: '+1%', value: midPrice * 1.01 },
      { label: '+2%', value: midPrice * 1.02 },
    ];
  }, [direction, midPrice, bidPrice, askPrice, t]);

  // Handle price input change (decimal validation)
  const handlePriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onLimitPriceChange(value);
      }
    },
    [onLimitPriceChange],
  );

  // Format price on blur
  const handlePriceBlur = useCallback(() => {
    if (limitPrice) {
      const numValue = parseFloat(limitPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onLimitPriceChange(formatPrice(numValue));
      }
    }
  }, [limitPrice, onLimitPriceChange, formatPrice]);

  // Handle preset button click
  const handlePresetClick = useCallback(
    (presetValue: number) => {
      if (presetValue > 0) {
        onLimitPriceChange(formatPrice(presetValue));
      }
    },
    [onLimitPriceChange, formatPrice],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      className="min-w-0 w-full"
    >
      {/* Label */}
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        fontWeight={FontWeight.Medium}
      >
        {t('perpsLimitPrice')}
      </Text>

      {/* Preset Buttons */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        className="min-w-0 w-full"
      >
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={() => handlePresetClick(preset.value)}
            className={twMerge('flex-1', 'min-w-0', 'rounded-md')}
            data-testid={`limit-price-preset-${preset.label}`}
          >
            {preset.label}
          </Button>
        ))}
      </Box>

      {/* Price Input */}
      <TextField
        size={TextFieldSize.Md}
        value={limitPrice}
        onChange={handlePriceChange}
        onBlur={handlePriceBlur}
        placeholder="0.00"
        borderRadius={BorderRadius.MD}
        borderWidth={0}
        backgroundColor={BackgroundColor.backgroundMuted}
        className="w-full"
        data-testid="limit-price-input"
        startAccessory={
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            $
          </Text>
        }
      />
    </Box>
  );
};

export default LimitPriceInput;
