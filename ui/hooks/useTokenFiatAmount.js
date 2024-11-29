import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import {
  getTokenExchangeRates,
  getCurrentCurrency,
  getShouldShowFiat,
  getConfirmationExchangeRates,
  getMarketData,
  getCurrencyRates,
} from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { getConversionRate } from '../ducks/metamask/metamask';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';

/**
 * Get the token balance converted to fiat and formatted for display
 *
 * @param {string} [tokenAddress] - The token address
 * @param {string} [tokenAmount] - The token balance
 * @param {string} [tokenSymbol] - The token symbol
 * @param {object} [overrides] - A configuration object that allows the caller to explicitly pass an exchange rate or
 *                              ensure fiat is shown even if the property is not set in state.
 * @param {number} [overrides.exchangeRate] -  An exhchange rate to use instead of the one selected from state
 * @param {boolean} [overrides.showFiat] - If truthy, ensures the fiat value is shown even if the showFiat value from state is falsey
 * @param {boolean} hideCurrencySymbol - Indicates whether the returned formatted amount should include the trailing currency symbol
 * @returns {string} The formatted token amount in the user's chosen fiat currency
 * @param {string} [chainId] - The chain id
 */
export function useTokenFiatAmount(
  tokenAddress,
  tokenAmount,
  tokenSymbol,
  overrides = {},
  hideCurrencySymbol,
  chainId = null,
) {
  const allMarketData = useSelector(getMarketData);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const contractMarketData = chainId
    ? Object.entries(allMarketData[chainId]).reduce(
        (acc, [address, marketData]) => {
          acc[address] = marketData?.price ?? null;
          return acc;
        },
        {},
      )
    : null;

  const tokenMarketData = chainId ? contractMarketData : contractExchangeRates;

  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);
  const mergedRates = {
    ...tokenMarketData,
    ...confirmationExchangeRates,
  };

  const currencyRates = useSelector(getCurrencyRates);
  const conversionRate = useSelector(getConversionRate);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const tokenConversionRate = chainId
    ? currencyRates?.[networkConfigurationsByChainId[chainId]?.nativeCurrency]
        ?.conversionRate
    : conversionRate;

  const currentCurrency = useSelector(getCurrentCurrency);
  const userPrefersShownFiat = useSelector(getShouldShowFiat);
  const showFiat = overrides.showFiat ?? userPrefersShownFiat;
  const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
    isEqualCaseInsensitive(key, tokenAddress),
  );
  const tokenExchangeRate =
    overrides.exchangeRate ??
    (contractExchangeTokenKey && mergedRates[contractExchangeTokenKey]);
  const formattedFiat = useMemo(
    () =>
      getTokenFiatAmount(
        tokenExchangeRate,
        tokenConversionRate,
        currentCurrency,
        tokenAmount,
        tokenSymbol,
        true,
        hideCurrencySymbol,
      ),
    [
      tokenConversionRate,
      tokenExchangeRate,
      currentCurrency,
      tokenAmount,
      tokenSymbol,
      hideCurrencySymbol,
    ],
  );

  if (!showFiat || currentCurrency.toUpperCase() === tokenSymbol) {
    return undefined;
  }

  return formattedFiat;
}
