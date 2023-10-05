import { shallowEqual, useSelector } from 'react-redux';
import {
  getAllTokens,
  getCurrentChainId,
  getCurrentCurrency,
  getMetaMaskCachedBalances,
  getTokenExchangeRates,
} from '../selectors';
import {
  decWEIToDecETH,
  decimalToHex,
  getValueFromWeiHex,
  hexWEIToDecETH,
  sumDecimals,
} from '../../shared/modules/conversion.utils';
import { getConversionRate } from '../ducks/metamask/metamask';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { useTokenTracker } from './useTokenTracker';

export const useAccountTotalFiatBalance = (
  address,
  shouldHideZeroBalanceTokens,
) => {
  const currentChainId = useSelector(getCurrentChainId);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const cachedBalances = useSelector(getMetaMaskCachedBalances);
  const balance = cachedBalances?.[address] ?? 0;
  const nativeFiat = getValueFromWeiHex({
    value: balance,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });

  const allTokens = useSelector(getAllTokens);
  const tokens = allTokens?.[currentChainId]?.[address] ?? [];

  const { loading, tokensWithBalances } = useTokenTracker({
    tokens,
    address,
    includeFailedTokens: true,
    hideZeroBalanceTokens: shouldHideZeroBalanceTokens,
  });

  console.log("tokensWithBalances: ", tokensWithBalances);

  // Create fiat values for token balances
  const tokenFiatBalances = tokensWithBalances.map((token) => {
    const contractExchangeTokenKey = Object.keys(contractExchangeRates).find(
      (key) => isEqualCaseInsensitive(key, token.address),
    );
    const tokenExchangeRate =
      (contractExchangeTokenKey &&
        contractExchangeRates[contractExchangeTokenKey]) ??
      0;

    const totalFiatValue = getTokenFiatAmount(
      tokenExchangeRate,
      conversionRate,
      currentCurrency,
      token.string,
      token.symbol,
      false,
      false,
    );

    return totalFiatValue;
  });

  const totalEthBalances = tokensWithBalances.map((token) => {
    const eth = decWEIToDecETH(token.balance);
    console.log(`ETH value of ${token.balance} is: `, eth);
    return eth;
  });
  const totalEthBalance = sumDecimals(
    hexWEIToDecETH(balance),
    ...totalEthBalances,
  ).toString(10);

  console.log('hexWEIToDecETH(balance): ', hexWEIToDecETH(balance));
  console.log('totalEthBalances: ', totalEthBalances);
  console.log("totalEthBalance is: ", totalEthBalance);

  // Total native and token fiat balance as a string (ex: "8.90")
  const totalFiatBalance = sumDecimals(
    nativeFiat,
    ...tokenFiatBalances,
  ).toString(10);

  // Fiat balance formatted in user's desired currency (ex: "$8.90")
  const formattedTotalFiatBalance = formatCurrency(
    totalFiatBalance,
    currentCurrency,
  );

  // Balance converted to hex for ETH representation
  const hexTotalBalance = decimalToHex(Number(totalFiatBalance));

  console.log('totalFiatBalance is: ', totalFiatBalance);
  console.log('hexTotalBalance is: ', hexTotalBalance);

  return {
    formattedTotalFiatBalance,
    totalFiatBalance,
    hexTotalBalance,
    tokensWithBalances,
    loading,
  };
};
