import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  formatCurrency,
  getValueFromWeiHex,
} from '../helpers/utils/confirm-tx.util';
import {
  getCurrentCurrency,
  getConversionRate,
  getNativeCurrency,
  getPreferences,
} from '../selectors';

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
  // const toCurrency = currency || currentCurrency;
  
  // first determine which is primary and secondary currency (this probably shouldn't be computed... should raise to state)
  const primaryCurrency = {
    currency: useNativeCurrencyAsPrimaryCurrency ? nativeCurrency : currentCurrency,
    value: useNativeCurrencyAsPrimaryCurrency ? inputValue : null;
  } 
  const secondaryCurrency = {
   currency: useNativeCurrencyAsPrimaryCurrency ? currentCurrency : nativeCurrency;
   value: useNativeCurrencyAsPrimaryCurrency ? null : inputValue;
  }

  const conversionRate = useSelector(getConversionRate);
  // we can't rely on this conversion rate if nativeCurrency is falsy 
  // because we use the nativeCurrency symbol for the network to fetch conversion rate
  const validConversionRate = Boolean(nativeCurrency && conversionRate);

  // const requiresConversion = 
  if(primaryCurrency.value){
    secondaryCurrency.value =
    getValueFromWeiHex({
      value: inputValue,
      fromCurrency: nativeCurrency,
      toCurrency,
      conversionRate,
      numberOfDecimals: numberOfDecimals || 2,
      toDenomination: denomination,
    });
  }

  const value = useMemo(() => {
    if (displayValue) {
      return displayValue;
    }
    let computedValue;
    switch (true) {
      case requiresConversion && validConversionRate:
        computedValue = getValueFromWeiHex({
          value: inputValue,
          fromCurrency: nativeCurrency,
          toCurrency,
          conversionRate,
          numberOfDecimals: numberOfDecimals || 2,
          toDenomination: denomination,
        });
        break;

      // if this is a secondary/fiat currency and we don't have a valid conversion rate we return null
      // so that we don't show a false or stale conversion rate
      case requiresConversion && !validConversionRate:
        // flip back to primary currency?
        computedValue = null;
        break;

      // if this is a primary currency we don't want to apply a conversion rate so we just convert
      // from a hex to a dec with a fromDenomination of WEI
      default:
        computedValue = conversionUtil(inputValue, {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          numberOfDecimals: numberOfDecimals || 2,
        });
    }

    if (computedValue === null) {
      return null;
    }

    return formatCurrency(computedValue, toCurrency);
  }, [
    inputValue,
    nativeCurrency,
    conversionRate,
    displayValue,
    numberOfDecimals,
    denomination,
    toCurrency,
    type,
    validConversionRate,
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
