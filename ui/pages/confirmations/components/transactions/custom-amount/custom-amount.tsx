import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  HeroAmountInput,
  HeroAmountInputSkeleton,
} from '../../../../../components/ui/hero-amount-input';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';

const FIAT_DISPLAY_DECIMALS = 2;

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
  <HeroAmountInputSkeleton data-testid="custom-amount-skeleton" />
);

export const CustomAmount = React.memo(
  ({
    amountFiat,
    autoFocus = false,
    currency: currencyProp,
    disabled = false,
    hasAlert = false,
    isLoading = false,
    onChange,
  }: CustomAmountProps) => {
    const selectedCurrency = useSelector(getCurrentCurrency);
    const currency = currencyProp ?? selectedCurrency;

    return (
      <HeroAmountInput
        prefix={getCurrencySymbol(currency)}
        // Parent-driven amounts (Max / percentage) may be full precision for
        // submit; the field shows cents only.
        value={getAmountFiatDisplay(amountFiat)}
        onChange={onChange}
        maxDecimals={FIAT_DISPLAY_DECIMALS}
        autoFocus={autoFocus}
        disabled={disabled}
        hasError={hasAlert}
        isLoading={isLoading}
        data-testid="custom-amount"
      />
    );
  },
);
