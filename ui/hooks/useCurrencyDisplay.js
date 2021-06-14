import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  formatCurrency,
  getValueFromWeiHex,
} from '../helpers/utils/confirm-tx.util';
import { getCurrentCurrency, getPreferences } from '../selectors';
import {
  getConversionRate,
  getNativeCurrency,
} from '../ducks/metamask/metamask';

import { PRIMARY, SECONDARY } from '../helpers/constants/common';

import { conversionUtil } from '../helpers/utils/conversion-util';

/**
 * Defines the shape of the options parameter for useCurrencyDisplay
 * @typedef {Object} UseCurrencyOptions
 * @property {string} [displayValue]     - When present is used in lieu of formatting the inputValue
 * @property {string} [prefix]           - String to prepend to the final result
 * @property {number} [numberOfDecimals] - Number of significant decimals to display
 * @property {string} [denomination]     - Denomination (wei, gwei) to convert to for display
 * @property {string} [currency]         - Currency type to convert to. Will override nativeCurrency
 */

/**
 * Defines the return shape of the second value in the tuple
 * @typedef {Object} CurrencyDisplayParts
 * @property {string} [prefix]  - string to prepend to the value for display
 * @property {string} value     - string representing the value, formatted for display
 * @property {string} [suffix]  - string to append to the value for display
 */

/**
 * useCurrencyDisplay hook
 *
 * Given a hexadecimal encoded value string and an object of parameters used for formatting the
 * display, produce both a fully formed string and the pieces of that string used for displaying
 * the currency to the user
 * @param {string} inputValue          - The value to format for display
 * @param {UseCurrencyOptions} opts    - An object for options to format the inputValue
 * @return {[string, CurrencyDisplayParts]}
 */
export function useCurrencyDisplay(
  inputValue,
  {
    displayValue,
    prefix,
    numberOfDecimals,
    denomination,
    currency,
    type,
    ...opts
  },
) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const toCurrency = currency || currentCurrency;
  const conversionRate = useSelector(getConversionRate);

  const requiresConversion =
    (type === SECONDARY && useNativeCurrencyAsPrimaryCurrency) ||
    (type === PRIMARY && !useNativeCurrencyAsPrimaryCurrency);

  const value = useMemo(() => {
    if (displayValue) {
      return displayValue;
    }

    let computedValue;

    if (requiresConversion && conversionRate) {
      computedValue = getValueFromWeiHex({
        value: inputValue,
        fromCurrency: nativeCurrency,
        toCurrency,
        conversionRate,
        numberOfDecimals: numberOfDecimals || 2,
        toDenomination: denomination,
      });
    } else if (requiresConversion && !conversionRate) {
      // if this is a secondary/fiat currency and we don't have a valid conversion rate we return null
      // so that we don't show a false or stale conversion rate
      computedValue = null;
    } else {
      // if this is native currency we don't want to apply a conversion rate so we just convert
      // from a hex to a dec with a fromDenomination of WEI
      computedValue = conversionUtil(inputValue, {
        fromNumericBase: 'hex',
        toNumericBase: 'dec',
        fromDenomination: 'WEI',
        numberOfDecimals: numberOfDecimals || 2,
        toDenomination: denomination,
      });
    }

    return computedValue ? formatCurrency(computedValue, toCurrency) : null;
  }, [
    inputValue,
    nativeCurrency,
    conversionRate,
    displayValue,
    numberOfDecimals,
    denomination,
    toCurrency,
    requiresConversion,
  ]);

  let suffix;

  if (!opts.hideLabel) {
    suffix = opts.suffix || toCurrency.toUpperCase();
  }

  return value
    ? [
        `${prefix || ''}${value}${suffix ? ` ${suffix}` : ''}`,
        { prefix, value, suffix },
      ]
    : [null, null];
}
