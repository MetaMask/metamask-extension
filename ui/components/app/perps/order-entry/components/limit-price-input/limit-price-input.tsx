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
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import React, { useCallback, useMemo } from 'react';

import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { TextField, TextFieldSize } from '../../../../../component-library';
import type { OrderDirection } from '../../order-entry.types';
import {
  isLimitPriceUnfavorable,
  isNearLiquidationPrice,
} from '../../limit-price-warnings';
import { isUnsignedDecimalInput } from '../../utils';

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
  /** Order direction (long or short) */
  direction: OrderDirection;
  /** Raw estimated liquidation price (for proximity warning) */
  liquidationPrice?: number | null;
};

/**
 * LimitPriceInput - Price input with Mid button as end accessory
 * @param options0
 * @param options0.limitPrice
 * @param options0.onLimitPriceChange
 * @param options0.currentPrice
 * @param options0.midPrice
 * @param options0.direction
 * @param options0.liquidationPrice
 */
export const LimitPriceInput: React.FC<LimitPriceInputProps> = ({
  limitPrice,
  onLimitPriceChange,
  currentPrice,
  midPrice: midPriceProp,
  direction,
  liquidationPrice,
}) => {
  const t = useI18nContext();
  const midPrice = midPriceProp ?? currentPrice;

  const handlePriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || isUnsignedDecimalInput(value)) {
        onLimitPriceChange(value);
      }
    },
    [onLimitPriceChange],
  );

  const handlePriceBlur = useCallback(() => {
    if (!limitPrice) {
      onLimitPriceChange('');
      return;
    }

    const parsed = Number.parseFloat(limitPrice);
    if (Number.isFinite(parsed) && parsed > 0) {
      onLimitPriceChange(parsed.toString());
      return;
    }

    onLimitPriceChange('');
  }, [limitPrice, onLimitPriceChange]);

  const handleMidClick = useCallback(() => {
    if (midPrice > 0) {
      onLimitPriceChange(midPrice.toString());
    }
  }, [midPrice, onLimitPriceChange]);

  const limitPriceWarning = useMemo(() => {
    if (!isLimitPriceUnfavorable(limitPrice, currentPrice, direction)) {
      return null;
    }
    return direction === 'long'
      ? t('perpsLimitPriceAboveCurrentPrice')
      : t('perpsLimitPriceBelowCurrentPrice');
  }, [limitPrice, currentPrice, direction, t]);

  const liquidationWarning = useMemo(() => {
    if (!isNearLiquidationPrice(currentPrice, liquidationPrice, direction)) {
      return null;
    }
    return t('perpsLimitPriceNearLiquidation');
  }, [currentPrice, liquidationPrice, direction, t]);

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
        inputProps={{ inputMode: 'decimal' }}
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

      {limitPriceWarning && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          data-testid="limit-price-warning"
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Xs}
            color={IconColor.WarningDefault}
          />
          <Text variant={TextVariant.BodyXs} color={TextColor.WarningDefault}>
            {limitPriceWarning}
          </Text>
        </Box>
      )}

      {liquidationWarning && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          data-testid="limit-price-liquidation-warning"
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Xs}
            color={IconColor.ErrorDefault}
          />
          <Text variant={TextVariant.BodyXs} color={TextColor.ErrorDefault}>
            {liquidationWarning}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default LimitPriceInput;
