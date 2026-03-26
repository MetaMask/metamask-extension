import React, { useCallback } from 'react';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  FontWeight,
  TextColor,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../component-library';
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

export const PerpsFiatHeroAmountSkeleton: React.FC = () => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    justifyContent={JustifyContent.center}
    alignItems={AlignItems.center}
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
          if (/^[0-9]*[.,]?[0-9]*$/u.test(next)) {
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
                width: `${Math.max(1, amountLength)}ch`,
                cursor: disabled ? 'default' : 'text',
              } as React.CSSProperties
            }
          />
        </Box>
      );
    },
  );
