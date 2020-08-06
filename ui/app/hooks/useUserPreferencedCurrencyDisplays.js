import { useCurrencyDisplay } from './useCurrencyDisplay'
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency'
import { PRIMARY, SECONDARY } from '../helpers/constants/common'

/**
* Defines the shape of the options parameter for useUserPreferencedCurrencyDisplays
* @typedef {Object} UseUserPreferencedCurrencyDisplayOptions
* @property {UseUserPreferencedCurrencyOptions} [primaryPreferenceOpts]    - The configuration options for getting the primary currency user preferences
* @property {UseUserPreferencedCurrencyOptions} [secondaryPreferenceOpts]  - The configuration options for getting the secondary currency user preferences
* @property {UseCurrencyOptions} [primaryCurrencyOpts]                     - The configuration options for getting the primary currency display
* @property {UseCurrencyOptions} [secondaryCurrencyOpts]                   - The configuration options for getting the secondary currency display
*/

/**
 * Defines the return shape of useUserPreferencedCurrencyDisplays
 * @typedef {Object} UserPreferencedCurrencyDisplays
 * @property {string} primaryCurrencyDisplay   - a display string of the PRIMARY type
 * @property {string} secondaryCurrencyDisplay - a display string of the SECONDARY type
 */

/**
* useUserPreferencedCurrencyDisplays hook
*
* Given a hexadecimal encoded value string and optional objects of parameters used for formatting the
* displays, produces two fully formed strings: one for the primary display type and one for the secondary
* display type
* @param {string} inputValue                                - The value to format for display
* @param {UseUserPreferencedCurrencyDisplayOptions} opts    - An object of options for formatting the return values
* @return {[string, CurrencyDisplayParts]}
*/
export function useUserPreferencedCurrencyDisplays (inputValue, {
  primaryPreferenceOpts = {},
  secondaryPreferenceOpts = {},
  primaryCurrencyOpts = {},
  secondaryCurrencyOpts = {},
}) {
  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, primaryPreferenceOpts)
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, secondaryPreferenceOpts)

  const [primaryCurrencyDisplay] = useCurrencyDisplay(
    inputValue,
    { numberOfDecimals: primaryNumberOfDecimals, currency: primaryCurrency, ...primaryCurrencyOpts },
  )
  const [secondaryCurrencyDisplay] = useCurrencyDisplay(
    inputValue,
    { numberOfDecimals: secondaryNumberOfDecimals, currency: secondaryCurrency, ...secondaryCurrencyOpts },
  )

  return { primaryCurrencyDisplay, secondaryCurrencyDisplay }
}
