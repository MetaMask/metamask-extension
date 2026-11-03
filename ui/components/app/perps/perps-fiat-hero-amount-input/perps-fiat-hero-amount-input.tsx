import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontFamily,
  Input,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  twMerge,
  Skeleton,
} from '@metamask/design-system-react';
import { getCurrencySymbol } from '../../../../helpers/utils/common.util';
import {
  AMOUNT_INPUT_MAX_FONT_SIZE,
  getAmountInputTextStyle,
} from '../../../../helpers/utils/amount-input-font-size';
import { useAmountInputFontSize } from '../../../../hooks/useAmountInputFontSize';
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
 * Visual twin of confirmations `CustomAmount` for standalone Perps screens.
 * Keep in sync manually with `ui/pages/confirmations/.../custom-amount.tsx`.
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
    const fiatSymbol = getCurrencySymbol('USD');

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (isValidPartialFiatAmountInput(next)) {
          onChange(next);
        }
      },
      [onChange],
    );

    const { containerRef, fontSize } = useAmountInputFontSize(
      `${fiatSymbol}${value || '0'}`,
    );
    const amountStyle = useMemo(
      () => getAmountInputTextStyle(fontSize),
      [fontSize],
    );

    if (isLoading) {
      return <PerpsFiatHeroAmountSkeleton />;
    }

    const textColor = getHeroAmountTextColor(hasAlert, disabled);

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
          data-testid="perps-fiat-hero-amount-symbol"
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          textAlign={TextAlign.Right}
          color={textColor}
          style={amountStyle}
        >
          {fiatSymbol}
        </Text>
        {/*
         * Absolute-overlay pattern: the hidden clone (white-space:pre) drives
         * the outer span's width to the exact rendered text width, while the
         * absolutely-positioned input fills that same box.  Absolute children
         * are out-of-flow so they don't affect the parent's max-content width,
         * avoiding the circular-dependency that broke the inline-grid approach.
         * Works in Chrome, Firefox, and Safari (unlike field-sizing:content).
         */}
        <span
          style={{
            position: 'relative',
            width: 'max-content',
            minWidth: '1ch',
          }}
        >
          <Text
            aria-hidden="true"
            variant={TextVariant.AmountDisplayLg}
            fontFamily={FontFamily.Hero}
            className="invisible block min-w-[1ch] whitespace-pre"
            style={amountStyle}
          >
            {value || '0'}
          </Text>
          <Input
            autoFocus={autoFocus && !disabled}
            data-testid="perps-fiat-hero-amount-input"
            type="text"
            inputMode="decimal"
            value={value}
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
