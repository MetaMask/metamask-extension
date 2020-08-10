import { getPreferences, getShouldShowFiat, getNativeCurrency } from '../selectors'
import { useSelector } from 'react-redux'
import { PRIMARY, SECONDARY, ETH } from '../helpers/constants/common'
import { useCurrencyDisplay } from './useCurrencyDisplay'

/**
* Defines the shape of the options parameter for useUserPreferencedCurrencyDisplays
* @typedef {Object} UseUserPreferencedCurrencyDisplayOptions
* @property {number} [numberOfDecimals] - umber of significant decimals to display
*/


/**
* useUserPreferencedCurrencyDisplays hook
*
* Given a hexadecimal encoded value string, display type and optional objects of parameters used for formatting the
* displays, produces a string for displaying currency to a user according to their preferences
* @param {string} inputValue                                - The value to format for display
* @param {"PRIMARY" | "SECONDARY"} type                     - what display type is being rendered
* @param {UseUserPreferencedCurrencyDisplayOptions} opts    - An object of options for formatting the return values
* @return {[string]}
*/
export function useUserPreferencedCurrencyDisplays (inputValue, type, opts = {}) {
  const nativeCurrency = useSelector(getNativeCurrency)
  const {
    useNativeCurrencyAsPrimaryCurrency,
  } = useSelector(getPreferences)
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

  const [useUserPreferencedCurrencyDisplay] = useCurrencyDisplay(
    inputValue,
    { numberOfDecimals, currency, ...opts },
  )

  return useUserPreferencedCurrencyDisplay
}
