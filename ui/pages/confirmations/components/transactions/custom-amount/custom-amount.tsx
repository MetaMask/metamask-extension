import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { Skeleton } from '@metamask/design-system-react';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  FontWeight,
  TextColor,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../../components/component-library';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
} from '../../../hooks/pay/useTransactionPayData';

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

/**
 * Matches `useTransactionCustomAmount` so a typed value can be compared with
 * the amount the parent stores after normalization.
 *
 * @param value - Raw input value.
 * @returns Normalized fiat string.
 */
function normalizeFiatInput(value: string): string {
  let newAmount = value.replace(',', '.').replace(/^0+/u, '') || '0';

  if (newAmount.startsWith('.')) {
    newAmount = `0${newAmount}`;
  }

  return newAmount;
}

function getFontSize(displayWidth: number): string {
  if (displayWidth <= 8) {
    return '64px';
  }
  if (displayWidth <= 13) {
    return '40px';
  }
  if (displayWidth <= 18) {
    return '30px';
  }
  return '20px';
}

function getLineHeight(displayWidth: number): string {
  if (displayWidth <= 8) {
    return '70px';
  }
  if (displayWidth <= 13) {
    return '44px';
  }
  if (displayWidth <= 18) {
    return '33px';
  }
  return '22px';
}

function getTextColor(
  hasAlert: boolean,
  disabled: boolean,
): TextColor | undefined {
  if (hasAlert) {
    return TextColor.errorDefault;
  }
  if (disabled) {
    return TextColor.textMuted;
  }
  return TextColor.textDefault;
}

export const CustomAmountSkeleton = () => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    justifyContent={JustifyContent.center}
    alignItems={AlignItems.center}
    style={{ minHeight: '70px' }}
    data-testid="custom-amount-skeleton"
  >
    <Skeleton height={70} width={80} />
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
    const isMaxAmount = useTransactionPayIsMaxAmount();
    const isQuotesLoading = useIsTransactionPayLoading();
    const selectedCurrency = useSelector(getCurrentCurrency);
    const currency = currencyProp ?? selectedCurrency;
    const fiatSymbol = getCurrencySymbol(currency);
    // Parent-driven amounts (Max / percentage) may be full precision for
    // submit; show cents only until the user types a new value.
    const [lastTypedAmount, setLastTypedAmount] = useState<string | null>(null);
    const amountFiatDisplay =
      lastTypedAmount === amountFiat
        ? amountFiat
        : getAmountFiatDisplay(amountFiat);
    const amountLength = amountFiatDisplay.length;
    const decimalSeparatorCount = (amountFiatDisplay.match(/[.,]/gu) || [])
      .length;
    // Decimal separators visually take roughly half the width of a digit in
    // proportional fonts, so account for them as 0.5ch each. Counting them
    // as a full ch over-allocates (visible cursor gap); counting them as 0
    // under-allocates (text gets clipped when overflowing the input).
    const amountWidth = amountLength - decimalSeparatorCount * 0.5;
    const displayWidth = amountWidth + Math.max(1, fiatSymbol.length);

    const showLoader = isLoading || (isMaxAmount && isQuotesLoading);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (/^[0-9]*[.,]?[0-9]*$/u.test(value)) {
          setLastTypedAmount(normalizeFiatInput(value));
          onChange?.(value);
        }
      },
      [onChange],
    );

    if (showLoader) {
      return <CustomAmountSkeleton />;
    }

    const fontSize = getFontSize(displayWidth);
    const lineHeight = getLineHeight(displayWidth);
    const textColor = getTextColor(hasAlert, disabled);

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        style={{ minHeight: '70px' }}
      >
        <Text
          data-testid="custom-amount-symbol"
          textAlign={TextAlign.Right}
          fontWeight={FontWeight.Medium}
          color={textColor}
          style={{ fontSize, lineHeight }}
        >
          {fiatSymbol}
        </Text>
        <input
          autoFocus={autoFocus && !disabled}
          data-testid="custom-amount-input"
          type="text"
          inputMode="decimal"
          value={amountFiatDisplay}
          onChange={handleChange}
          disabled={disabled}
          style={
            {
              fontSize,
              lineHeight,
              fontWeight: 500,
              color: textColor ? `var(--color-${textColor})` : 'inherit',
              textAlign: 'left',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: `${Math.max(1, amountWidth)}ch`,
              cursor: disabled ? 'default' : 'text',
            } as React.CSSProperties
          }
        />
      </Box>
    );
  },
);
