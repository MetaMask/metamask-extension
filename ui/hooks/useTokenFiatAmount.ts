import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import {
  getTokenExchangeRates,
  getShouldShowFiat,
  getConfirmationExchangeRates,
  getMarketData,
  getCurrencyRates,
} from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { getCurrentCurrency } from '../ducks/metamask/metamask';
import { getConversionRate } from '../ducks/metamask/base-selectors';
import { isEqualCaseInsensitive } from '../../shared/lib/string-utils';

type TokenFiatAmountOverrides = {
  /** An exchange rate to use instead of the one selected from state */
  exchangeRate?: number;
  /** If truthy, ensures the fiat value is shown even if the showFiat value from state is falsey */
  showFiat?: boolean;
};

/**
 * Get the token balance converted to fiat and formatted for display
 *
 * @param tokenAddress - The token address
 * @param tokenAmount - The token balance
 * @param tokenSymbol - The token symbol
 * @param overrides - A configuration object that allows the caller to explicitly
 * pass an exchange rate or ensure fiat is shown even if the property is not set in state.
 * @param hideCurrencySymbol - Indicates whether the returned formatted amount should include the trailing currency symbol
 * @param chainId - The chain id
 * @param formatted - Whether the return value should be formatted or not
 * @returns The formatted token amount in the user's chosen fiat currency
 */
export function useTokenFiatAmount(
  tokenAddress?: string,
  tokenAmount?: string,
  tokenSymbol?: string,
  overrides: TokenFiatAmountOverrides = {},
  hideCurrencySymbol?: boolean,
  chainId: string | null = null,
  formatted = true,
): string | undefined {
  const allMarketData = useSelector(getMarketData) as Record<
    string,
    Record<string, { price?: number | null }>
  >;

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  ) as Record<string, number>;

  const contractMarketData =
    chainId && allMarketData[chainId]
      ? Object.entries(allMarketData[chainId]).reduce<Record<string, number | null>>(
          (acc, [address, marketData]) => {
            acc[address] = marketData?.price ?? null;
            return acc;
          },
          {},
        )
      : null;

  const tokenMarketData = chainId ? contractMarketData : contractExchangeRates;

  const confirmationExchangeRates = useSelector(
    getConfirmationExchangeRates,
  ) as Record<string, number>;
  const mergedRates: Record<string, number | null> = {
    ...(tokenMarketData as Record<string, number | null>),
    ...confirmationExchangeRates,
  };

  const currencyRates = useSelector(getCurrencyRates) as Record<
    string,
    { conversionRate?: number }
  >;
  const conversionRate = useSelector(getConversionRate) as number;
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  ) as Record<string, { nativeCurrency?: string }>;

  const tokenConversionRate = chainId
    ? currencyRates?.[
        networkConfigurationsByChainId[chainId]?.nativeCurrency ?? ''
      ]?.conversionRate
    : conversionRate;

  const currentCurrency = useSelector(getCurrentCurrency) as string;
  const userPrefersShownFiat = useSelector(getShouldShowFiat) as boolean;
  const showFiat = overrides.showFiat ?? userPrefersShownFiat;
  const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
    isEqualCaseInsensitive(key, tokenAddress),
  );
  const tokenExchangeRate =
    overrides.exchangeRate ??
    (contractExchangeTokenKey
      ? (mergedRates[contractExchangeTokenKey] as number)
      : undefined);
  const formattedFiat = useMemo(
    () =>
      getTokenFiatAmount(
        tokenExchangeRate,
        tokenConversionRate,
        currentCurrency,
        tokenAmount,
        tokenSymbol,
        formatted,
        hideCurrencySymbol,
      ),
    [
      tokenConversionRate,
      tokenExchangeRate,
      currentCurrency,
      tokenAmount,
      tokenSymbol,
      formatted,
      hideCurrencySymbol,
    ],
  );

  if (!showFiat || currentCurrency.toUpperCase() === tokenSymbol) {
    return undefined;
  }

  return formattedFiat;
}
