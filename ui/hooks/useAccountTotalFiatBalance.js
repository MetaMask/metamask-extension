import { shallowEqual, useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import { useMemo } from 'react';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import {
  getAllTokens,
  getMetaMaskCachedBalances,
  getTokenExchangeRates,
  getConfirmationExchangeRates,
} from '../selectors';
import {
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
  sumDecimals,
} from '../../shared/modules/conversion.utils';
import {
  getConversionRate,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../helpers/utils/util';
import { useTokenTracker } from './useTokenBalances';

export const useAccountTotalFiatBalance = (
  account,
  shouldHideZeroBalanceTokens,
) => {
  const currentChainId = useSelector(getCurrentChainId);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);

  const cachedBalances = useSelector(getMetaMaskCachedBalances);
  const balance = cachedBalances?.[account?.address] ?? 0;
  const nativeFiat = getValueFromWeiHex({
    value: balance,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });

  const detectedTokens = useSelector(getAllTokens);
  const tokens = useMemo(
    () => detectedTokens?.[currentChainId]?.[account?.address] ?? [],
    [account?.address, currentChainId, detectedTokens],
  );

  const loading = false;
  const { tokensWithBalances } = useTokenTracker({
    chainId: currentChainId,
    tokens,
    address: account?.address,
    hideZeroBalanceTokens: shouldHideZeroBalanceTokens,
  });

  const mergedRates = useMemo(
    () => ({
      ...contractExchangeRates,
      ...confirmationExchangeRates,
    }),
    [confirmationExchangeRates, contractExchangeRates],
  );

  // Create fiat values for token balances
  const tokenFiatBalances = useMemo(
    () =>
      tokensWithBalances.map((token) => {
        const tokenExchangeRate = mergedRates[toChecksumAddress(token.address)];

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
      }),
    [tokensWithBalances, mergedRates, conversionRate, currentCurrency],
  );

  // Total native and token fiat balance as a string (ex: "8.90")
  const totalFiatBalance = sumDecimals(
    nativeFiat,
    ...tokenFiatBalances,
  ).toString(10);

  const formattedTokensWithBalances = useMemo(() => {
    // we need to append some values to tokensWithBalance for UI
    // this code was ported from asset-list
    tokensWithBalances.forEach((token) => {
      // token.string is the balance displayed in the TokenList UI
      token.string = roundToDecimalPlacesRemovingExtraZeroes(token.string, 5);

      // to sort by fiat balance, we need to compute this at this level
      const tokenExchangeRate = mergedRates[toChecksumAddress(token.address)];
      token.tokenFiatAmount =
        getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate,
          currentCurrency,
          token.string, // tokenAmount
          token.symbol, // tokenSymbol
          false, // no currency symbol prefix
          false, // no ticker symbol suffix
        ) || '0';
    });

    return tokensWithBalances;
  }, [tokensWithBalances, mergedRates, conversionRate, currentCurrency]);

  // Fiat balance formatted in user's desired currency (ex: "$8.90")
  const formattedFiat = formatCurrency(totalFiatBalance, currentCurrency);

  // WEI Number which can be used with UserPreferencedCurrencyDisplay component
  let totalWeiBalance = getWeiHexFromDecimalValue({
    value: totalFiatBalance,
    fromCurrency: currentCurrency,
    conversionRate,
    invertConversionRate: true,
  });

  // If we have a totalFiatBalance of "0" and conversionRate of "0",
  // getWeiHexFromDecimalValue responds with "NaN"
  if (totalWeiBalance === 'NaN') {
    totalWeiBalance = '0x0';
  }

  return {
    formattedFiat,
    totalWeiBalance,
    totalFiatBalance,
    tokensWithBalances: formattedTokensWithBalances,
    loading,
    mergedRates,
  };
};
