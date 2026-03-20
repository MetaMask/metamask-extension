import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import {
  normalizeLocalizedNumberInput,
  parseLocalizedNumber,
  toCanonicalFixedPrice,
} from '../../../utils/localeNumber';

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
  const locale = useSelector(getIntlLocale);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const formatPrice = useCallback(
    (value: number): string =>
      formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [formatNumber],
  );

  const midPrice = midPriceProp ?? currentPrice;

  const formattedLimitPrice = useMemo(() => {
    if (!limitPrice) {
      return '';
    }

    const parsed = parseLocalizedNumber(limitPrice, locale);
    if (parsed === null || parsed <= 0) {
      return '';
    }

    return formatPrice(parsed);
  }, [formatPrice, limitPrice, locale]);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formattedLimitPrice);
    }
  }, [isFocused, formattedLimitPrice]);

  const handlePriceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      const canonicalDraft = normalizeLocalizedNumberInput(value, locale, {
        allowTrailingDecimal: true,
      });

      if (canonicalDraft === null) {
        return;
      }

      setInputValue(value);
      onLimitPriceChange(canonicalDraft);
    },
    [locale, onLimitPriceChange],
  );

  const handlePriceFocus = useCallback(() => {
    setIsFocused(true);
    setInputValue(limitPrice);
  }, [limitPrice]);

  const handlePriceBlur = useCallback(() => {
    setIsFocused(false);

    if (!limitPrice) {
      onLimitPriceChange('');
      return;
    }

    const canonical = toCanonicalFixedPrice(limitPrice, locale);
    if (canonical) {
      onLimitPriceChange(canonical);
    }
  }, [limitPrice, locale, onLimitPriceChange]);

  const handleMidClick = useCallback(() => {
    if (midPrice > 0) {
      onLimitPriceChange(midPrice.toFixed(2));
    }
  }, [midPrice, onLimitPriceChange]);

  const placeholderValue = useMemo(() => formatPrice(0), [formatPrice]);

  const displayedValue = isFocused ? inputValue : formattedLimitPrice;

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
        value={displayedValue}
        onChange={handlePriceChange}
        onFocus={handlePriceFocus}
        onBlur={handlePriceBlur}
        placeholder={placeholderValue}
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
    </Box>
  );
};

export default LimitPriceInput;
