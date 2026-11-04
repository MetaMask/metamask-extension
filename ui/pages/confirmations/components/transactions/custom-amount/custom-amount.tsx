import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Skeleton,
} from '@metamask/design-system-react';
import { HeroAmountInput } from '../../../../../components/ui/hero-amount-input';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import { AMOUNT_INPUT_MAX_FONT_SIZE } from '../../../../../helpers/utils/amount-input-font-size';
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

    if (isLoading) {
      return <CustomAmountSkeleton />;
    }

    return (
      <HeroAmountInput
        prefix={fiatSymbol}
        value={amountFiatDisplay}
        onChange={(event) => onChange?.(event.target.value)}
        isValidInput={(next) => FIAT_INPUT_PATTERN.test(next)}
        autoFocus={autoFocus}
        disabled={disabled}
        hasError={hasAlert}
        data-testid="custom-amount"
        prefixTestId="custom-amount-symbol"
        inputTestId="custom-amount-input"
        amountTestId="custom-amount-value"
      />
    );
  },
);
