import React from 'react';
import { useSelector } from 'react-redux';

import { zeroAddress } from 'ethereumjs-util';
import {
  getCurrentCurrency,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokensMarketData,
} from '../../../selectors';

import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { formatValue, isValidAmount } from '../../../../app/scripts/lib/util';
import { getIntlLocale } from '../../../ducks/locale/locale';
import {
  Display,
  TextColor,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';
import { getCalculatedTokenAmount1dAgo } from '../../../helpers/utils/util';

export const AggregatedPercentageOverview = () => {
  const tokensMarketData = useSelector(getTokensMarketData);
  const locale = useSelector(getIntlLocale);
  const fiatCurrency = useSelector(getCurrentCurrency);
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  // Get total balance (native + tokens)
  const { totalFiatBalance, orderedTokenList } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  let totalFiat1dAgo = 0;
  orderedTokenList.forEach((token) => {
    if (token.address) {
      // This is a regular ERC20 token
      // find the relevant pricePercentChange1d in tokensMarketData
      // Iterate through the keys of the record
      let found;
      for (const key in tokensMarketData) {
        if (
          isEqualCaseInsensitive(
            tokensMarketData[key].tokenAddress,
            token.address,
          )
        ) {
          found = tokensMarketData[key];
        }
      }
      const tokenFiat1dAgo = getCalculatedTokenAmount1dAgo(
        token?.fiatBalance,
        found?.pricePercentChange1d,
      );
      totalFiat1dAgo += Number(tokenFiat1dAgo);
    } else {
      // native token
      const nativePricePercentChange1d =
        tokensMarketData?.[zeroAddress()]?.pricePercentChange1d;

      const nativeFiat1dAgo = getCalculatedTokenAmount1dAgo(
        token?.fiatBalance,
        nativePricePercentChange1d,
      );

      totalFiat1dAgo += Number(nativeFiat1dAgo);
    }
  });

  const totalBalance: number = Number(totalFiatBalance);
  const totalBalance1dAgo = totalFiat1dAgo;

  const amountChange = totalBalance - totalBalance1dAgo;
  const percentageChange = (amountChange / totalBalance1dAgo) * 100 || 0;

  const formattedPercentChange = formatValue(
    amountChange === 0 ? 0 : percentageChange,
    true,
  );

  const formattedAmountChange = isValidAmount(amountChange)
    ? `${(amountChange as number) >= 0 ? '+' : ''}${Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        style: 'currency',
        currency: fiatCurrency,
        maximumFractionDigits: 2,
      }).format(amountChange as number)} `
    : '';

  let color = TextColor.textDefault;

  if (isValidAmount(amountChange)) {
    if ((amountChange as number) === 0) {
      color = TextColor.textDefault;
    } else if ((amountChange as number) > 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  }
  return (
    <Box display={Display.Flex}>
      <Text
        fontWeight={FontWeight.Normal}
        variant={TextVariant.bodyMd}
        color={color}
        data-testid="aggregated-value-change"
        style={{ whiteSpace: 'pre' }}
        ellipsis
      >
        {formattedAmountChange}
      </Text>
      <Text
        fontWeight={FontWeight.Normal}
        variant={TextVariant.bodyMd}
        color={color}
        data-testid="aggregated-percentage-change"
        ellipsis
      >
        {formattedPercentChange}
      </Text>
    </Box>
  );
};
