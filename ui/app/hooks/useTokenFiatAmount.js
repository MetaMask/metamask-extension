import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getTokenExchangeRates, getConversionRate, getCurrentCurrency, getShouldShowFiat } from '../selectors'
import { getFormattedTokenFiatAmount } from '../helpers/utils/token-util'

/**
 * Get the token balance converted to fiat and formatted for display
 *
 * @param {string} [tokenAddress] - The token address
 * @param {string} [tokenAmount] - The token balance
 * @param {string} [tokenSymbol] - The token symbol
 * @return {string} - The formatted token amount in the user's chosen fiat currency
 */
export function useTokenFiatAmount (tokenAddress, tokenAmount, tokenSymbol) {
  const contractExchangeRates = useSelector(getTokenExchangeRates)
  const conversionRate = useSelector(getConversionRate)
  const currentCurrency = useSelector(getCurrentCurrency)
  const showFiat = useSelector(getShouldShowFiat)

  const tokenExchangeRate = contractExchangeRates[tokenAddress]

  const formattedFiat = useMemo(
    () => getFormattedTokenFiatAmount(
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
