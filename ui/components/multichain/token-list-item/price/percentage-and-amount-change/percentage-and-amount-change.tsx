import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { isHexString, zeroAddress } from 'ethereumjs-util';
import { Text, Box } from '../../../../component-library';
import {
  Display,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  getCurrentCurrency,
  getSelectedAccountCachedBalance,
  getTokensMarketData,
} from '../../../../../selectors';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { EtherDenomination } from '../../../../../../shared/constants/common';
import { Numeric } from '../../../../../../shared/modules/Numeric';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../../../ducks/metamask/metamask';

const renderPercentageWithNumber = (
  value: string,
  formattedValuePrice: string,
  color: TextColor,
) => {
  return (
    <Box display={Display.Flex}>
      <Text
        fontWeight={FontWeight.Normal}
        variant={TextVariant.bodyMd}
        color={color}
        data-testid="token-increase-decrease-value"
        style={{ whiteSpace: 'pre' }}
        ellipsis
      >
        {formattedValuePrice}
      </Text>
      <Text
        fontWeight={FontWeight.Normal}
        variant={TextVariant.bodyMd}
        color={color}
        data-testid="token-increase-decrease-percentage"
        ellipsis
      >
        {value}
      </Text>
    </Box>
  );
};

export const PercentageAndAmountChange = ({
  value,
}: {
  value: number | null | undefined;
}) => {
  const fiatCurrency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);
  const balanceValue = useSelector(getSelectedAccountCachedBalance);
  const conversionRate = useSelector(getConversionRate);
  const nativeCurrency = useSelector(getNativeCurrency);
  const marketData = useSelector(getTokensMarketData);

  const balanceChange = useMemo(() => {
    const percentage1d = marketData?.[zeroAddress()]?.pricePercentChange1d;

    if (isHexString(balanceValue)) {
      let numeric = new Numeric(balanceValue, 16, EtherDenomination.WEI);

      if (nativeCurrency !== fiatCurrency) {
        numeric = numeric.applyConversionRate(conversionRate);
      }

      if (numeric.isZero()) {
        return 0;
      }

      if (percentage1d) {
        return numeric
          .toBase(10)
          .toDenomination(EtherDenomination.ETH)
          .round(2, BigNumber.ROUND_HALF_DOWN)
          .times(percentage1d, 10)
          .divide(100, 10)
          .toNumber();
      }
      return null;
    }
    return null;
  }, [marketData]);

  let color = TextColor.textDefault;
  const isValidAmount = (amount: number | null | undefined): boolean =>
    amount !== null && amount !== undefined && !Number.isNaN(amount);

  if (isValidAmount(value)) {
    if ((value as number) >= 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  }

  const formattedValue = isValidAmount(value)
    ? `(${(value as number) >= 0 ? '+' : ''}${(value as number).toFixed(2)}%)`
    : '';

  const formattedValuePrice = isValidAmount(balanceChange)
    ? `${(balanceChange as number) >= 0 ? '+' : ''}${Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        style: 'currency',
        currency: fiatCurrency,
        maximumFractionDigits: 2,
      }).format(balanceChange as number)} `
    : '';

  return renderPercentageWithNumber(formattedValue, formattedValuePrice, color);
};
