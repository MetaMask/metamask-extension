import { useSelector, shallowEqual } from 'react-redux';
import { useEffect, useState } from 'react';
import {
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getCurrentCurrency,
  getTokenExchangeRates,
  getConfirmationExchangeRates,
} from '../../../../selectors';
import { useAccountTotalFiatBalance } from '../../../../hooks/useAccountTotalFiatBalance';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../helpers/utils/util';
import { TokenWithBalance } from '../asset-list/asset-list';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { getTokenFiatAmount } from '../../../../helpers/utils/token-util';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
// import useAccountTotalFiatBalance from './useAccountTotalFiatBalance';
// import { roundToDecimalPlacesRemovingExtraZeroes, getTokenFiatAmount } from './utils';
// import isEqualCaseInsensitive from './isEqualCaseInsensitive'; // Assume this is a utility function

export const useTokenList = () => {
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);
  const mergedRates = {
    ...contractExchangeRates,
    ...confirmationExchangeRates,
  };

  const accountTotalFiatBalance = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  const [tokenList, setTokenList] = useState<TokenWithBalance[]>([]);
  const [loading, setLoading] = useState(accountTotalFiatBalance.loading);

  useEffect(() => {
    console.log('sorting....');
    setLoading(accountTotalFiatBalance.loading);

    const tokensWithBalances =
      accountTotalFiatBalance.tokensWithBalances as TokenWithBalance[];

    tokensWithBalances.forEach((token) => {
      token.string = roundToDecimalPlacesRemovingExtraZeroes(
        token.string,
        5,
      ) as string;
    });

    tokensWithBalances.forEach((token) => {
      const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
        isEqualCaseInsensitive(key, token.address),
      );

      const tokenExchangeRate =
        contractExchangeTokenKey && mergedRates[contractExchangeTokenKey];

      token.tokenFiatAmount =
        getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate,
          currentCurrency,
          token.string,
          token.symbol,
          false,
          false,
        ) || '0';
    });

    setTokenList(tokensWithBalances);
    setLoading(accountTotalFiatBalance.loading);
  }, [accountTotalFiatBalance, conversionRate, currentCurrency, mergedRates]);

  return { tokenList, setTokenList, loading };
};
