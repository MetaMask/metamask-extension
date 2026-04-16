import React, { useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  twMerge,
} from '@metamask/design-system-react';
import { Skeleton } from '../../../component-library/skeleton';
import { getCurrencySymbol } from '../../../../helpers/utils/common.util';
import type { PerpsFiatHeroAmountInputProps } from './perps-fiat-hero-amount-input.types';

/**
 * Visual twin of confirmations `CustomAmount` for standalone Perps screens.
 * Keep in sync manually with `ui/pages/confirmations/.../custom-amount.tsx`.
 * @param length
 */
function getFontSize(length: number): string {
  if (length <= 8) {
    return '64px';
  }
  if (length <= 13) {
    return '40px';
  }
  if (length <= 18) {
    return '30px';
  }
  return '20px';
}

function getLineHeight(length: number): string {
  if (length <= 8) {
    return '70px';
  }
  if (length <= 13) {
    return '44px';
  }
  if (length <= 18) {
    return '33px';
  }
  return '22px';
}

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

function getHeroAmountTextColor(
  hasAlert: boolean,
  disabled: boolean,
): TextColor {
  if (hasAlert) {
    return TextColor.ErrorDefault;
  }
  if (disabled) {
    return TextColor.TextMuted;
  }
  return TextColor.TextDefault;
}

export const PerpsFiatHeroAmountSkeleton: React.FC = () => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Center}
    alignItems={BoxAlignItems.Center}
    style={{ minHeight: '70px' }}
    data-testid="perps-fiat-hero-amount-skeleton"
  >
    <Skeleton height={70} width={80} />
  </Box>
);

export const PerpsFiatHeroAmountInput: React.FC<PerpsFiatHeroAmountInputProps> =
  React.memo(
    ({
      value,
      onChange,
      disabled = false,
      hasAlert = false,
      isLoading = false,
    }) => {
      const fiatSymbol = getCurrencySymbol('USD');
      const amountLength = value.length;

      const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const next = e.target.value;
          if (isValidPartialFiatAmountInput(next)) {
            onChange(next);
          }
        },
        [onChange],
      );

      if (isLoading) {
        return <PerpsFiatHeroAmountSkeleton />;
      }

      const fontSize = getFontSize(amountLength);
      const lineHeight = getLineHeight(amountLength);
      const textColor = getHeroAmountTextColor(hasAlert, disabled);

      return (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          style={{ minHeight: '70px' }}
        >
          <Text
            data-testid="perps-fiat-hero-amount-symbol"
            textAlign={TextAlign.Right}
            fontWeight={FontWeight.Medium}
            color={textColor}
            style={{ fontSize, lineHeight }}
          >
            {fiatSymbol}
          </Text>
          <input
            data-testid="perps-fiat-hero-amount-input"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={twMerge(
              textColor,
              'border-none bg-transparent text-left outline-none',
              disabled ? 'cursor-default' : 'cursor-text',
            )}
            style={
              {
                fontSize,
                lineHeight,
                fontWeight: 500,
                width: `${Math.max(1, amountLength)}ch`,
              } as React.CSSProperties
            }
          />
        </Box>
      );
    },
  );
