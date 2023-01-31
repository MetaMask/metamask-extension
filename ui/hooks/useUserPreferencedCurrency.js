import { shallowEqual, useSelector } from 'react-redux';
import {
  getPreferences,
  getShouldShowFiat,
  getCurrentCurrency,
} from '../selectors';
import { getNativeCurrency } from '../ducks/metamask/metamask';

import { PRIMARY, SECONDARY } from '../helpers/constants/common';
import { EtherDenomination } from '../../shared/constants/common';

/**
 * Defines the shape of the options parameter for useUserPreferencedCurrency
 *
 * @typedef {object} UseUserPreferencedCurrencyOptions
 * @property {number} [numberOfDecimals] - Number of significant decimals to display
 * @property {number} [ethNumberOfDecimals] - Number of significant decimals to display
 *                                             when using ETH
 * @property {number} [fiatNumberOfDecimals] - Number of significant decimals to display
 *                                            when using fiat
 */

/**
 * Defines the return shape of useUserPreferencedCurrency
 *
 * @typedef {object} UserPreferredCurrency
 * @property {string} currency - the currency type to use (eg: 'ETH', 'usd')
 * @property {number} numberOfDecimals - Number of significant decimals to display
 */

/**
 * useUserPreferencedCurrency
 *
 * returns an object that contains what currency to use for displaying values based
 * on the user's preference settings, as well as the significant number of decimals
 * to display based on the currency
 *
 * @param {"PRIMARY" | "SECONDARY"} type - what display type is being rendered
 * @param {UseUserPreferencedCurrencyOptions} opts - options to override default values
 * @returns {UserPreferredCurrency}
 */
export function useUserPreferencedCurrency(type, opts = {}) {
  const nativeCurrency = useSelector(getNativeCurrency);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(
    getPreferences,
    shallowEqual,
  );
  const showFiat = useSelector(getShouldShowFiat) || opts.showFiatOverride;
  const currentCurrency = useSelector(getCurrentCurrency);

  let currency, numberOfDecimals;
  if (
    !showFiat ||
    (type === PRIMARY && useNativeCurrencyAsPrimaryCurrency) ||
    (type === SECONDARY && !useNativeCurrencyAsPrimaryCurrency)
  ) {
    // Display ETH
    currency = nativeCurrency || EtherDenomination.ETH;
    numberOfDecimals = opts.numberOfDecimals || opts.ethNumberOfDecimals || 8;
  } else if (
    (type === SECONDARY && useNativeCurrencyAsPrimaryCurrency) ||
    (type === PRIMARY && !useNativeCurrencyAsPrimaryCurrency)
  ) {
    // Display Fiat
    currency = currentCurrency;
    numberOfDecimals = opts.numberOfDecimals || opts.fiatNumberOfDecimals || 2;
  }

  return { currency, numberOfDecimals };
}
