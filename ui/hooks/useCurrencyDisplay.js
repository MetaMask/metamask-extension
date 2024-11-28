import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import {
  getMultichainCurrentCurrency,
  getMultichainIsEvm,
  getMultichainNativeCurrency,
  getMultichainConversionRate,
} from '../selectors/multichain';

import { getValueFromWeiHex } from '../../shared/modules/conversion.utils';
import { TEST_NETWORK_TICKER_MAP } from '../../shared/constants/network';
import { Numeric } from '../../shared/modules/Numeric';
import { EtherDenomination } from '../../shared/constants/common';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { useMultichainSelector } from './useMultichainSelector';

// The smallest non-zero amount that can be displayed.
export const MIN_AMOUNT = 0.000001;

// The string to display when 0 < amount < MIN_AMOUNT.
// TODO(dbrans): Localize this string using Intl.NumberFormatter.
const MIN_AMOUNT_DISPLAY = `<${MIN_AMOUNT}`;

// The default precision for displaying currency values.
// It set to the number of decimal places in the minimum amount.
export const DEFAULT_PRECISION = new BigNumber(MIN_AMOUNT).decimalPlaces();

function formatEthCurrencyDisplay({
  isNativeCurrency,
  isUserPreferredCurrency,
  currency,
  nativeCurrency,
  inputValue,
  conversionRate,
  denomination,
  numberOfDecimals,
}) {
  if (isNativeCurrency || (!isUserPreferredCurrency && !nativeCurrency)) {
    const ethDisplayValue = new Numeric(inputValue, 16, EtherDenomination.WEI)
      .toDenomination(denomination || EtherDenomination.ETH)
      .round(numberOfDecimals || DEFAULT_PRECISION)
      .toBase(10)
      .toString();

    return ethDisplayValue === '0' && inputValue && Number(inputValue) !== 0
      ? MIN_AMOUNT_DISPLAY
      : ethDisplayValue;
  } else if (isUserPreferredCurrency && conversionRate) {
    return formatCurrency(
      getValueFromWeiHex({
        value: inputValue,
        fromCurrency: nativeCurrency,
        toCurrency: currency,
        conversionRate,
        numberOfDecimals: numberOfDecimals || 2,
        toDenomination: denomination,
      }),
      currency,
    );
  }
  return null;
}

function formatNonEvmAssetCurrencyDisplay({
  tokenSymbol,
  isNativeCurrency,
  isUserPreferredCurrency,
  currency,
  currentCurrency,
  nativeCurrency,
  inputValue,
  conversionRate,
}) {
  if (isNativeCurrency || (!isUserPreferredCurrency && !nativeCurrency)) {
    // NOTE: We use the value coming from the BalancesController here (and thus, the non-EVM
    // account Snap).
    // We use `Numeric` here, so we handle those amount the same way than for EVMs (it's worth
    // noting that if `inputValue` is not properly defined, the amount will be set to '0', see
    // `Numeric` constructor for that)
    return new Numeric(inputValue, 10).toString();
  } else if (isUserPreferredCurrency && conversionRate) {
    const amount =
      getTokenFiatAmount(
        1, // coin to native conversion rate is 1:1
        Number(conversionRate), // native to fiat conversion rate
        currentCurrency,
        inputValue,
        tokenSymbol,
        false,
        false,
      ) ?? '0'; // if the conversion fails, return 0
    return formatCurrency(amount, currency);
  }
  return null;
}

/**
 * Defines the shape of the options parameter for useCurrencyDisplay
 *
 * @typedef {object} UseCurrencyOptions
 * @property {string} [displayValue] - When present is used in lieu of formatting the inputValue
 * @property {string} [prefix] - String to prepend to the final result
 * @property {number} [numberOfDecimals] - Number of significant decimals to display
 * @property {string} [denomination] - Denomination (wei, gwei) to convert to for display
 * @property {string} [currency] - Currency type to convert to. Will override nativeCurrency
 * @property {boolean} [hideLabel] – hide the currency label
 */

/**
 * Defines the return shape of the second value in the tuple
 *
 * @typedef {object} CurrencyDisplayParts
 * @property {string} [prefix] - string to prepend to the value for display
 * @property {string} value - string representing the value, formatted for display
 * @property {string} [suffix] - string to append to the value for display
 */

/**
 * useCurrencyDisplay hook
 *
 * Given a hexadecimal encoded value string and an object of parameters used for formatting the
 * display, produce both a fully formed string and the pieces of that string used for displaying
 * the currency to the user
 *
 * @param {string} inputValue - The value to format for display
 * @param {UseCurrencyOptions} opts - An object for options to format the inputValue
 * @returns {[string, CurrencyDisplayParts]}
 */
export function useCurrencyDisplay(
  inputValue,
  {
    account,
    displayValue,
    prefix,
    numberOfDecimals,
    denomination,
    currency,
    isAggregatedFiatOverviewBalance,
    ...opts
  },
) {
  const isEvm = useMultichainSelector(getMultichainIsEvm, account);
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    account,
  );
  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    account,
  );
  const conversionRate = useMultichainSelector(
    getMultichainConversionRate,
    account,
  );

  const isUserPreferredCurrency = currency === currentCurrency;
  const isNativeCurrency = currency === nativeCurrency;

  const value = useMemo(() => {
    if (displayValue) {
      return displayValue;
    }

    if (!isEvm) {
      return formatNonEvmAssetCurrencyDisplay({
        tokenSymbol: nativeCurrency,
        isNativeCurrency,
        isUserPreferredCurrency,
        currency,
        currentCurrency,
        nativeCurrency,
        inputValue,
        conversionRate,
      });
    }

    if (isAggregatedFiatOverviewBalance) {
      return formatCurrency(inputValue, currency);
    }

    return formatEthCurrencyDisplay({
      isNativeCurrency,
      isUserPreferredCurrency,
      currency,
      nativeCurrency,
      inputValue,
      conversionRate,
      denomination,
      numberOfDecimals,
    });
  }, [
    displayValue,
    isEvm,
    isNativeCurrency,
    isUserPreferredCurrency,
    currency,
    nativeCurrency,
    inputValue,
    conversionRate,
    denomination,
    numberOfDecimals,
    currentCurrency,
    isAggregatedFiatOverviewBalance,
  ]);

  let suffix;

  if (!opts.hideLabel) {
    // if the currency we are displaying is the native currency of one of our preloaded test-nets (goerli, sepolia etc.)
    // then we allow lowercase characters, otherwise we force to uppercase any suffix passed as a currency
    const currencyTickerSymbol = Object.values(
      TEST_NETWORK_TICKER_MAP,
    ).includes(currency)
      ? currency
      : currency?.toUpperCase();

    suffix = opts.suffix || currencyTickerSymbol;
  }

  return [
    `${prefix || ''}${value}${suffix ? ` ${suffix}` : ''}`,
    { prefix, value, suffix },
  ];
}
