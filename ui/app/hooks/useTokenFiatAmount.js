import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getTokenExchangeRates, getConversionRate, getCurrentCurrency, getShouldShowFiat } from '../selectors'
import { getTokenFiatAmount } from '../helpers/utils/token-util'

/**
 * Get the token balance converted to fiat and formatted for display
 *
 * @param {string} [tokenAddress] - The token address
 * @param {string} [tokenAmount] - The token balance
 * @param {string} [tokenSymbol] - The token symbol
 * @param {object} [overrides] - A configuration object that allows the called to explicitly pass an exchange rate or
 *                              ensure fiat is shown even if the property is not set in state.
 * @property {number} overrides.exchangeRate An exhchange rate to use instead of the one selected from state
 * @property {boolean} overrides.showFiat If truthy, ensures the fiat value is shown even if the showFiat value from state is falsey
 * @return {string} - The formatted token amount in the user's chosen fiat currency
 */
export function useTokenFiatAmount (tokenAddress, tokenAmount, tokenSymbol, overrides) {
  const contractExchangeRates = useSelector(getTokenExchangeRates)
  const conversionRate = useSelector(getConversionRate)
  const currentCurrency = useSelector(getCurrentCurrency)
  const userPrefersShownFiat = useSelector(getShouldShowFiat)
  const showFiat = overrides.showFiat || userPrefersShownFiat
  const tokenExchangeRate = overrides.exchangeRate || contractExchangeRates[tokenAddress]
  const formattedFiat = useMemo(
    () => getTokenFiatAmount(
      tokenExchangeRate,
      conversionRate,
      currentCurrency,
      tokenAmount,
      tokenSymbol,
    ),
    [tokenExchangeRate, conversionRate, currentCurrency, tokenAmount, tokenSymbol],
  )

  if (!showFiat || currentCurrency.toUpperCase() === tokenSymbol) {
    return undefined
  }

  return formattedFiat
}
