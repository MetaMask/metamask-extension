import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontFamily,
  Input,
  Skeleton,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import {
  AMOUNT_INPUT_MAX_FONT_SIZE,
  getAmountInputTextStyle,
} from '../../../../../helpers/utils/amount-input-font-size';
import { useAmountInputFontSize } from '../../../../../hooks/useAmountInputFontSize';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';

const FIAT_DISPLAY_DECIMALS = 2;

// The field is a fiat amount, so keystrokes past the cent are rejected.
const FIAT_INPUT_PATTERN = /^\d*[.,]?\d{0,2}$/u;

export type CustomAmountProps = {
  amountFiat: string;
  autoFocus?: boolean;
  currency?: string;
  disabled?: boolean;
  hasAlert?: boolean;
  isLoading?: boolean;
  onChange?: (value: string) => void;
};

/**
 * Cents-only field value for a parent-driven amount (Max / percentage).
 * Sub-cent amounts are left intact so they do not collapse to `0`.
 *
 * @param amountFiat - Full-precision fiat amount used for quotes / submit.
 * @returns Value to render in the input.
 */
function getAmountFiatDisplay(amountFiat: string): string {
  const value = new BigNumber(amountFiat);

  if (!value.isFinite()) {
    return amountFiat;
  }

  const display = value.round(FIAT_DISPLAY_DECIMALS, BigNumber.ROUND_DOWN);

  if (display.eq(value) || (display.lte(0) && value.gt(0))) {
    return amountFiat;
  }

  return display.toString(10);
}

function getTextColor(hasAlert: boolean, disabled: boolean): TextColor {
  if (hasAlert) {
    return TextColor.ErrorDefault;
  }
  if (disabled) {
    return TextColor.TextMuted;
  }
  return TextColor.TextDefault;
}

export const CustomAmountSkeleton = () => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Center}
    alignItems={BoxAlignItems.Center}
    style={{ minHeight: AMOUNT_INPUT_MAX_FONT_SIZE }}
    data-testid="custom-amount-skeleton"
  >
    <Skeleton
      height={AMOUNT_INPUT_MAX_FONT_SIZE}
      width={80}
      className="rounded-lg"
    />
  </Box>
);

export const CustomAmount = React.memo(
  ({
    amountFiat,
    autoFocus = false,
    currency: currencyProp,
    disabled = false,
    hasAlert = false,
    isLoading,
    onChange,
  }: CustomAmountProps) => {
    const selectedCurrency = useSelector(getCurrentCurrency);
    const currency = currencyProp ?? selectedCurrency;
    const fiatSymbol = getCurrencySymbol(currency);
    // Parent-driven amounts (Max / percentage) may be full precision for
    // submit; the field shows cents only.
    const amountFiatDisplay = getAmountFiatDisplay(amountFiat);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (FIAT_INPUT_PATTERN.test(value)) {
          onChange?.(value);
        }
      },
      [onChange],
    );

    const { containerRef, fontSize } = useAmountInputFontSize(
      `${fiatSymbol}${amountFiatDisplay || '0'}`,
    );
    const amountStyle = useMemo(
      () => getAmountInputTextStyle(fontSize),
      [fontSize],
    );

    if (isLoading) {
      return <CustomAmountSkeleton />;
    }

    const textColor = getTextColor(hasAlert, disabled);

    return (
      <Box
        ref={containerRef}
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        className="w-full"
        style={{ minHeight: AMOUNT_INPUT_MAX_FONT_SIZE }}
      >
        <Text
          data-testid="custom-amount-symbol"
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          textAlign={TextAlign.Right}
          color={textColor}
          style={amountStyle}
        >
          {fiatSymbol}
        </Text>
        {/* The hidden amount sets an exact cross-browser input width. */}
        <span className="relative w-max min-w-[1ch]">
          <Text
            aria-hidden="true"
            variant={TextVariant.AmountDisplayLg}
            fontFamily={FontFamily.Hero}
            className="invisible block min-w-[1ch] whitespace-pre"
            style={amountStyle}
          >
            {amountFiatDisplay || '0'}
          </Text>
          <Input
            autoFocus={autoFocus && !disabled}
            data-testid="custom-amount-input"
            type="text"
            inputMode="decimal"
            value={amountFiatDisplay}
            onChange={handleChange}
            isDisabled={disabled}
            isStateStylesDisabled
            textVariant={TextVariant.AmountDisplayLg}
            className={twMerge(
              'absolute inset-0 rounded-none border-0 bg-transparent p-0 text-left font-hero',
              textColor,
              disabled ? 'cursor-default' : 'cursor-text',
            )}
            style={amountStyle}
          />
        </span>
      </Box>
    );
  },
);
