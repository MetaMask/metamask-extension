import React from 'react';
import { useSelector } from 'react-redux';
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
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
} from '../../../hooks/pay/useTransactionPayData';

export type CustomAmountProps = {
  amountFiat: string;
  currency?: string;
  disabled?: boolean;
  hasAlert?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
};

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

export const CustomAmountSkeleton: React.FC = () => (
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

export const CustomAmount: React.FC<CustomAmountProps> = React.memo(
  ({
    amountFiat,
    currency: currencyProp,
    disabled = false,
    hasAlert = false,
    isLoading,
    onClick,
  }) => {
    const isMaxAmount = useTransactionPayIsMaxAmount();
    const isQuotesLoading = useIsTransactionPayLoading();
    const selectedCurrency = useSelector(getCurrentCurrency);
    const currency = currencyProp ?? selectedCurrency;
    const fiatSymbol = getCurrencySymbol(currency);
    const amountLength = amountFiat.length;

    const showLoader = isLoading || (isMaxAmount && isQuotesLoading);

    if (showLoader) {
      return <CustomAmountSkeleton />;
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
        gap={1}
        style={{ minHeight: '70px' }}
      >
        <Text
          data-testid="custom-amount-symbol"
          textAlign={TextAlign.Center}
          fontWeight={FontWeight.Medium}
          color={textColor}
          style={{ fontSize, lineHeight }}
        >
          {fiatSymbol}
        </Text>
        <Text
          data-testid="custom-amount-input"
          textAlign={TextAlign.Center}
          fontWeight={FontWeight.Medium}
          color={textColor}
          style={{
            fontSize,
            lineHeight,
            cursor: disabled ? 'default' : 'pointer',
          }}
          onClick={disabled ? undefined : onClick}
        >
          {amountFiat}
        </Text>
      </Box>
    );
  },
);
