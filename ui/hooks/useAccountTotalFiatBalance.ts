import { shallowEqual, useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import { useMemo } from 'react';
import type { Token } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { getCurrentChainId } from '../../shared/lib/selectors/networks';
import {
  getAllTokens,
  getMetaMaskCachedBalances,
  getTokenExchangeRates,
  getConfirmationExchangeRates,
  getNativeCurrencyImage,
  getTokenList,
  getUSDConversionRate,
} from '../selectors';
import {
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
  sumDecimals,
} from '../../shared/lib/conversion.utils';
import {
  getNativeCurrency,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
import { getConversionRate } from '../ducks/metamask/base-selectors';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../helpers/utils/util';
import { useTokenTracker } from './useTokenBalances';

type TokenWithFiatBalance = Token & {
  balance?: string;
  string?: number | string;
  balanceError?: unknown;
  tokenFiatAmount?: string;
  fiatBalance?: string;
  iconUrl?: string;
};

type AllTokensWithFiatValues = {
  iconUrl?: string;
  symbol?: string;
  fiatBalance?: string;
  [key: string]: unknown;
};

export const useAccountTotalFiatBalance = (
  account: { address: string } | null | undefined,
  shouldHideZeroBalanceTokens: boolean | undefined,
  /**
   * The optional parameter to use USD conversion rate instead of the current currency.
   * If not provided, fallback to the current currency.
   */
  useUSD = false,
) => {
  const currentChainId = useSelector(getCurrentChainId);
  let conversionRate = useSelector(getConversionRate);
  const usdConversionRate = useSelector(getUSDConversionRate);
  let currentCurrency = useSelector(getCurrentCurrency);
  if (useUSD) {
    conversionRate = usdConversionRate;
    currentCurrency = 'usd';
  }

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);

  const cachedBalances = useSelector(getMetaMaskCachedBalances) as Record<
    string,
    string
  >;
  const balance = cachedBalances?.[account?.address ?? ''] ?? 0;
  const nativeFiat = getValueFromWeiHex({
    value: balance,
    toCurrency: currentCurrency,
    conversionRate,
    numberOfDecimals: 2,
  });

  const detectedTokens = useSelector(getAllTokens) as Record<
    string,
    Record<string, Token[]>
  >;
  const tokens = useMemo(
    () => detectedTokens?.[currentChainId]?.[account?.address ?? ''] ?? [],
    [account?.address, currentChainId, detectedTokens],
  );
  // This selector returns all the tokens, we need it to get the image of token
  const allTokenList = useSelector(getTokenList) as Record<
    string,
    TokenWithFiatBalance
  >;
  const primaryTokenImage = useSelector(getNativeCurrencyImage) as string;
  const nativeCurrency = useSelector(getNativeCurrency) as string;

  const loading = false;
  const { tokensWithBalances } = useTokenTracker({
    chainId: currentChainId as Hex,
    tokens: tokens as Token[],
    address: account?.address as Hex,
    hideZeroBalanceTokens: shouldHideZeroBalanceTokens,
  });

  const mergedRates = useMemo(
    () => ({
      ...(contractExchangeRates as Record<string, number>),
      ...(confirmationExchangeRates as Record<string, number>),
    }),
    [confirmationExchangeRates, contractExchangeRates],
  );

  // Create fiat values for token balances
  const tokenFiatBalances = useMemo(
    () =>
      (tokensWithBalances as TokenWithFiatBalance[]).map((token) => {
        const tokenExchangeRate =
          mergedRates[toChecksumAddress(token.address ?? '')];

        const totalFiatValue = getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate,
          currentCurrency,
          token.string as string,
          token.symbol,
          false,
          false,
        );

        return totalFiatValue;
      }),
    [tokensWithBalances, mergedRates, conversionRate, currentCurrency],
  );

  // To match the list of detected tokens with the entire token list to find the image for tokens
  const findMatchingTokens = (
    tokenList: Record<string, TokenWithFiatBalance>,
    _tokensWithBalances: TokenWithFiatBalance[],
  ) => {
    const result: TokenWithFiatBalance[] = [];

    _tokensWithBalances.forEach((token) => {
      const matchingToken = tokenList?.[token.address?.toLowerCase() ?? ''];

      if (matchingToken) {
        result.push({
          ...matchingToken,
          balance: token.balance,
          string: token.string,
          balanceError: token.balanceError,
        });
      }
    });

    return result;
  };

  const matchingTokens = useMemo(
    () =>
      findMatchingTokens(allTokenList, tokensWithBalances as TokenWithFiatBalance[]),
    [allTokenList, tokensWithBalances],
  );

  // Combine native token, detected token with image in an array
  const allTokensWithFiatValues = useMemo(() => {
    const nativeTokenValues: AllTokensWithFiatValues = {
      iconUrl: primaryTokenImage,
      symbol: nativeCurrency,
      fiatBalance: nativeFiat,
    };

    return [
      nativeTokenValues,
      ...matchingTokens.map((item, index) => ({
        ...item,
        fiatBalance: tokenFiatBalances[index],
      })),
    ];
  }, [
    matchingTokens,
    tokenFiatBalances,
    primaryTokenImage,
    nativeCurrency,
    nativeFiat,
  ]);

  // Order of the tokens in this array is in decreasing order based on their fiatBalance
  const orderedTokenList = useMemo(
    () =>
      allTokensWithFiatValues.sort(
        (a, b) =>
          parseFloat(b.fiatBalance as string) -
          parseFloat(a.fiatBalance as string),
      ),
    [allTokensWithFiatValues],
  );

  // Total native and token fiat balance as a string (ex: "8.90")
  const totalFiatBalance = sumDecimals(
    nativeFiat,
    ...tokenFiatBalances,
  ).toString(10);

  const formattedTokensWithBalances = useMemo(() => {
    // we need to append some values to tokensWithBalance for UI
    // this code was ported from asset-list
    (tokensWithBalances as TokenWithFiatBalance[]).forEach((token) => {
      // token.string is the balance displayed in the TokenList UI
      token.string = roundToDecimalPlacesRemovingExtraZeroes(
        token.string as string,
        5,
      );

      // to sort by fiat balance, we need to compute this at this level
      const tokenExchangeRate =
        mergedRates[toChecksumAddress(token.address ?? '')];
      token.tokenFiatAmount =
        getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate,
          currentCurrency,
          token.string as string, // tokenAmount
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
    orderedTokenList,
    mergedRates,
  };
};
