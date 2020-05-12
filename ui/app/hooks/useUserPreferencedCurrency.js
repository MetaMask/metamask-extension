import { preferencesSelector, getShouldShowFiat } from '../selectors'
import { useSelector } from 'react-redux'
import { PRIMARY, SECONDARY, ETH } from '../helpers/constants/common'

/**
 * Defines the shape of the options parameter for useUserPreferencedCurrency
 * @typedef {Object} UseUserPreferencedCurrencyOptions
 * @property {number} [numberOfDecimals]     - Number of significant decimals to display
 * @property {number} [ethNumberOfDecimals]  - Number of significant decimals to display
 *                                             when using ETH
 * @property {number} [fiatNumberOfDecimals] - Number of significant decimals to display
 *                                            when using fiat
 */

/**
 * Defines the return shape of useUserPreferencedCurrency
 * @typedef {Object} UserPreferredCurrency
 * @property {string} currency         - the currency type to use (eg: 'ETH', 'usd')
 * @property {number} numberOfDecimals - Number of significant decimals to display
 */

/**
 * useUserPreferencedCurrency
 *
 * returns an object that contains what currency to use for displaying values based
 * on the user's preference settings, as well as the significant number of decimals
 * to display based on the currency
 * @param {"PRIMARY" | "SECONDARY"} type - what display type is being rendered
 * @param {UseUserPreferencedCurrencyOptions} opts - options to override default values
 * @return {UserPreferredCurrency}
 */
export function useUserPreferencedCurrency (type, opts = {}) {
  const nativeCurrency = useSelector((state) => state.metamask.nativeCurrency)
  const {
    useNativeCurrencyAsPrimaryCurrency,
  } = useSelector(preferencesSelector)
  const showFiat = useSelector(getShouldShowFiat)

  let currency, numberOfDecimals
  if (!showFiat || (type === PRIMARY && useNativeCurrencyAsPrimaryCurrency) ||
    (type === SECONDARY && !useNativeCurrencyAsPrimaryCurrency)) {
    // Display ETH
    currency = nativeCurrency || ETH
    numberOfDecimals = opts.numberOfDecimals || opts.ethNumberOfDecimals || 6
  } else if ((type === SECONDARY && useNativeCurrencyAsPrimaryCurrency) ||
    (type === PRIMARY && !useNativeCurrencyAsPrimaryCurrency)) {
    // Display Fiat
    numberOfDecimals = opts.numberOfDecimals || opts.fiatNumberOfDecimals || 2
  }

  return { currency, numberOfDecimals }
}
