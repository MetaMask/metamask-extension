import { shallowEqual, useSelector } from 'react-redux';
import { getPreferences, getSelectedInternalAccount } from '../selectors';
import {
  getMultichainNativeCurrency,
  getMultichainCurrentCurrency,
  getMultichainShouldShowFiat,
} from '../selectors/multichain';

import { PRIMARY } from '../helpers/constants/common';
import { EtherDenomination } from '../../shared/constants/common';
import { ETH_DEFAULT_DECIMALS } from '../constants';
import { useMultichainSelector } from './useMultichainSelector';

/**
 * Defines the shape of the options parameter for useUserPreferencedCurrency
 *
 * @typedef {object} UseUserPreferencedCurrencyOptions
 * @property {number} [numberOfDecimals] - Number of significant decimals to display
 * @property {number} [ethNumberOfDecimals] - Number of significant decimals to display
 *                                             when using ETH
 * @property {number} [fiatNumberOfDecimals] - Number of significant decimals to display
 *                                            when using fiat
 * @property {boolean} [shouldCheckShowNativeToken] - Boolean to know if checking the setting
 *                                                  show native token as main balance is needed
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
 * on whether the user needs to check showNativeTokenAsMainBalance setting, as well as the significant number of decimals
 * to display based on the currency
 *
 *
 * @param {"PRIMARY" | "SECONDARY"} type - what display type is being rendered
 * @param {UseUserPreferencedCurrencyOptions} opts - options to override default values
 * @returns {UserPreferredCurrency}
 */
export function useUserPreferencedCurrency(type, opts = {}) {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const account = opts.account ?? selectedAccount;
  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );

  const { showNativeTokenAsMainBalance } = useSelector(
    getPreferences,
    shallowEqual,
  );
  const showFiat = useMultichainSelector(getMultichainShouldShowFiat, account);
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    account,
  );

  const fiatReturn = {
    currency: currentCurrency,
    numberOfDecimals: opts.numberOfDecimals || opts.fiatNumberOfDecimals || 2,
  };

  const nativeReturn = {
    currency: nativeCurrency || EtherDenomination.ETH,
    numberOfDecimals:
      opts.numberOfDecimals || opts.ethNumberOfDecimals || ETH_DEFAULT_DECIMALS,
  };

  if (opts.showNativeOverride) {
    return nativeReturn;
  } else if (opts.showFiatOverride) {
    return fiatReturn;
  } else if (!showFiat) {
    return nativeReturn;
  } else if (
    (opts.shouldCheckShowNativeToken && showNativeTokenAsMainBalance) ||
    !opts.shouldCheckShowNativeToken
  ) {
    return type === PRIMARY ? nativeReturn : fiatReturn;
  }
  return type === PRIMARY ? fiatReturn : nativeReturn;
}
