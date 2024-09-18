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
import {
  formatValue,
  isValidAmount,
} from '../../../../../../app/scripts/lib/util';

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
    // Extracts the 1-day percentage change in price from marketData using the zero address as a key.
    const percentage1d = marketData?.[zeroAddress()]?.pricePercentChange1d;

    // Checks if the balanceValue is in hex format. This is important for cryptocurrency balances which are often represented in hex.
    if (isHexString(balanceValue)) {
      // Converts the hex string balanceValue to a Numeric object for precise arithmetic operations. Assumes balance is in WEI (smallest Ether unit).
      let numeric = new Numeric(balanceValue, 16, EtherDenomination.WEI);

      // If the native currency of the balance is different from the fiat currency, applies a conversion rate to the balance.
      if (nativeCurrency !== fiatCurrency) {
        numeric = numeric.applyConversionRate(conversionRate);
      }

      // If the numeric balance is zero, immediately returns 0 to indicate no change.
      if (numeric.isZero()) {
        return 0;
      }

      // If there's a valid 1-day percentage change, calculates the balance change.
      if (percentage1d) {
        return numeric
          .toBase(10)
          .toDenomination(EtherDenomination.ETH)
          .round(2, BigNumber.ROUND_HALF_DOWN)
          .times(percentage1d, 10)
          .divide(100, 10)
          .toNumber();
      }
      // Returns null if balanceValue is not a hex string or if percentage1d is not available.
      return null;
    }
    return null;
  }, [marketData]);

  let color = TextColor.textDefault;

  if (isValidAmount(balanceChange)) {
    if ((balanceChange as number) === 0) {
      color = TextColor.textDefault;
    } else if ((balanceChange as number) > 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  }

  const formattedValue = formatValue(balanceChange === 0 ? 0 : value, true);

  let formattedValuePrice = '';
  if (isValidAmount(balanceChange)) {
    formattedValuePrice = (balanceChange as number) >= 0 ? '+' : '';

    const options = {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    } as const;

    try {
      // For currencies compliant with ISO 4217 Standard
      formattedValuePrice += `${Intl.NumberFormat(locale, {
        ...options,
        style: 'currency',
        currency: fiatCurrency,
      }).format(balanceChange as number)} `;
    } catch {
      // Non-standard Currency Codes
      formattedValuePrice += `${Intl.NumberFormat(locale, {
        ...options,
        style: 'decimal',
      }).format(balanceChange as number)} `;
    }
  }

  return renderPercentageWithNumber(formattedValue, formattedValuePrice, color);
};
