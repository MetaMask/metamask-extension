import { shallowEqual, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import { getPreferences } from '../../shared/lib/selectors/preferences';
import {
  getMultichainNativeCurrency,
  getMultichainCurrentCurrency,
  getMultichainShouldShowFiat,
} from '../selectors/multichain';

import { PRIMARY } from '../helpers/constants/common';
import { EtherDenomination } from '../../shared/constants/common';
import { ETH_DEFAULT_DECIMALS } from '../constants';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../shared/constants/network';
import { useMultichainSelector } from './useMultichainSelector';

/**
 * Defines the shape of the options parameter for useUserPreferencedCurrency
 */
export type UseUserPreferencedCurrencyOptions = {
  /** Number of significant decimals to display */
  numberOfDecimals?: number;
  /** Number of significant decimals to display when using ETH */
  ethNumberOfDecimals?: number;
  /** Boolean to know if checking the setting show native token as main balance is needed */
  shouldCheckShowNativeToken?: boolean;
  /** Boolean to override showFiat value from state */
  showFiatOverride?: boolean;
  /** Boolean to override showNative value from state */
  showNativeOverride?: boolean;
  /** The account to use */
  account?: InternalAccount | null;
};

/**
 * Defines the return shape of useUserPreferencedCurrency
 */
export type UserPreferredCurrency = {
  /** The currency type to use (eg: 'ETH', 'usd') */
  currency: string;
  /** Number of significant decimals to display */
  numberOfDecimals: number;
};

/**
 * useUserPreferencedCurrency
 *
 * returns an object that contains what currency to use for displaying values based
 * on whether the user needs to check showNativeTokenAsMainBalance setting, as well as the significant number of decimals
 * to display based on the currency
 *
 * @param type - what display type is being rendered
 * @param opts - options to override default values
 * @param chainId - chainId to use
 * @returns UserPreferredCurrency
 */
export function useUserPreferencedCurrency(
  type: 'PRIMARY' | 'SECONDARY' | undefined,
  opts: UseUserPreferencedCurrencyOptions = {},
  chainId: string | null = null,
): UserPreferredCurrency {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const account = opts.account ?? selectedAccount;
  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );

  const { showNativeTokenAsMainBalance } = useSelector(
    getPreferences,
    shallowEqual,
  ) as { showNativeTokenAsMainBalance: boolean };
  const showFiat = useMultichainSelector(getMultichainShouldShowFiat, account);
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    account,
  );

  const fiatReturn: UserPreferredCurrency = {
    currency: currentCurrency,
    numberOfDecimals: opts.numberOfDecimals || 2,
  };

  const nativeReturn: UserPreferredCurrency = {
    currency: chainId
      ? CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId] ||
        nativeCurrency ||
        EtherDenomination.ETH
      : nativeCurrency || EtherDenomination.ETH,
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
