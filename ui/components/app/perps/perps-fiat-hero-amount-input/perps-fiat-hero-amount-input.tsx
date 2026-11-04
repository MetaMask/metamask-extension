import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Skeleton,
} from '@metamask/design-system-react';
import { HeroAmountInput } from '../../../ui/hero-amount-input';
import { getCurrencySymbol } from '../../../../helpers/utils/common.util';
import { AMOUNT_INPUT_MAX_FONT_SIZE } from '../../../../helpers/utils/amount-input-font-size';
import type { PerpsFiatHeroAmountInputProps } from './perps-fiat-hero-amount-input.types';

/** Enough for realistic USD entry; bounds worst-case validation cost. */
const MAX_PARTIAL_FIAT_AMOUNT_LENGTH = 48;

/**
 * Partial amount while typing: digits with at most one `,` or `.` separator.
 * Linear-time (no regex) so pathological strings cannot burn CPU.
 * @param raw
 */
export function isValidPartialFiatAmountInput(raw: string): boolean {
  if (raw.length > MAX_PARTIAL_FIAT_AMOUNT_LENGTH) {
    return false;
  }
  let sawSeparator = false;
  for (const c of raw) {
    if (c >= '0' && c <= '9') {
      continue;
    }
    if (c === '.' || c === ',') {
      if (sawSeparator) {
        return false;
      }
      sawSeparator = true;
      continue;
    }
    return false;
  }
  return true;
}

export const PerpsFiatHeroAmountSkeleton = () => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Center}
    alignItems={BoxAlignItems.Center}
    className="w-full"
    style={{ minHeight: AMOUNT_INPUT_MAX_FONT_SIZE }}
    data-testid="perps-fiat-hero-amount-skeleton"
  >
    <Skeleton
      height={AMOUNT_INPUT_MAX_FONT_SIZE}
      width={80}
      className="rounded-lg"
    />
  </Box>
);

/**
 * USD amount field for standalone Perps screens. The 48-character input rule
 * stays here. Layout and font size come from `HeroAmountInput`.
 */
export const PerpsFiatHeroAmountInput = React.memo(
  ({
    value,
    onChange,
    autoFocus = false,
    disabled = false,
    hasAlert = false,
    isLoading = false,
  }: PerpsFiatHeroAmountInputProps) => {
    if (isLoading) {
      return <PerpsFiatHeroAmountSkeleton />;
    }

    return (
      <HeroAmountInput
        prefix={getCurrencySymbol('USD')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        isValidInput={isValidPartialFiatAmountInput}
        autoFocus={autoFocus}
        disabled={disabled}
        hasError={hasAlert}
        data-testid="perps-fiat-hero-amount"
        prefixTestId="perps-fiat-hero-amount-symbol"
        inputTestId="perps-fiat-hero-amount-input"
        amountTestId="perps-fiat-hero-amount-value"
      />
    );
  },
);
