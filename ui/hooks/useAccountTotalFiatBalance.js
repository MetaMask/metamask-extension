import { useSelector } from 'react-redux';
import {
  getAllTokens,
  getCurrentChainId,
  getCurrentCurrency,
  getMetaMaskCachedBalances,
} from '../selectors';
import {
  getValueFromWeiHex,
  sumDecimals,
} from '../../shared/modules/conversion.utils';
import { getConversionRate } from '../ducks/metamask/metamask';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { useTokenTracker } from './useTokenTracker';

export const useAccountTotalFiatBalance = (
  address,
  shouldHideZeroBalanceTokens,
) => {
  const currentChainId = useSelector(getCurrentChainId);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

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

  // Total native and token fiat balance as a string (ex: "8.90")
  const totalTokenFiatBalance = tokensWithBalances.map(
    (token) => token.totalFiatValue ?? '0',
  );
  const totalFiatBalance = sumDecimals(
    nativeFiat,
    ...totalTokenFiatBalance,
  ).toString(10);

  // Fiat balance formatted in user's desired currency (ex: "$8.90")
  const formattedTotalFiatBalance = formatCurrency(
    totalFiatBalance,
    currentCurrency,
  );

  return {
    formattedTotalFiatBalance,
    totalFiatBalance,
    tokensWithBalances,
    loading,
  };
};
