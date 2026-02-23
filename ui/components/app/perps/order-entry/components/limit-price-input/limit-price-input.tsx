import React, { useCallback } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  ButtonBase,
  ButtonBaseSize,
} from '@metamask/design-system-react';
import { TextField, TextFieldSize } from '../../../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../../hooks/useFormatters';

/**
 * Props for LimitPriceInput component
 */
export type LimitPriceInputProps = {
  /** Current limit price value */
  limitPrice: string;
  /** Callback when limit price changes */
  onLimitPriceChange: (price: string) => void;
  /** Current market price (fallback when mid not available) */
  currentPrice: number;
  /** Mid price from top-of-book (optional, falls back to currentPrice) */
  midPrice?: number;
};

/**
 * LimitPriceInput - Price input with Mid button as end accessory
 * @param options0
 * @param options0.limitPrice
 * @param options0.onLimitPriceChange
 * @param options0.currentPrice
 * @param options0.midPrice
 */
export const LimitPriceInput: React.FC<LimitPriceInputProps> = ({
  limitPrice,
  onLimitPriceChange,
  currentPrice,
  midPrice: midPriceProp,
}) => {
  const t = useI18nContext();
  const { formatNumber } = useFormatters();

  const formatPrice = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [formatNumber],
  );

  const midPrice = midPriceProp ?? currentPrice;

  const handlePriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^[\d,]*\.?\d*$/u.test(value)) {
        onLimitPriceChange(value);
      }
    },
    [onLimitPriceChange],
  );

  const handlePriceBlur = useCallback(() => {
    if (limitPrice) {
      const numValue = parseFloat(limitPrice.replace(/,/gu, ''));
      if (!isNaN(numValue) && numValue > 0) {
        onLimitPriceChange(formatPrice(numValue));
      }
    }
  }, [limitPrice, onLimitPriceChange, formatPrice]);

  const handleMidClick = useCallback(() => {
    if (midPrice > 0) {
      onLimitPriceChange(formatPrice(midPrice));
    }
  }, [midPrice, onLimitPriceChange, formatPrice]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      className="min-w-0 w-full"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodySm}>{t('perpsLimitPrice')}</Text>
      </Box>

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
        endAccessory={
          <ButtonBase
            size={ButtonBaseSize.Sm}
            onClick={handleMidClick}
            className="bg-transparent rounded-none px-2 min-w-0 h-auto"
            data-testid="limit-price-mid-button"
            textProps={{
              color: TextColor.PrimaryDefault,
              fontWeight: FontWeight.Medium,
              variant: TextVariant.BodySm,
            }}
          >
            {t('perpsMid')}
          </ButtonBase>
        }
      />
    </Box>
  );
};

export default LimitPriceInput;
