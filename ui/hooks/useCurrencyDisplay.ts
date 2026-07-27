import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { MULTICHAIN_NETWORK_TICKER } from '@metamask/multichain-network-controller';
import { formatCurrency as deprecatedFormatCurrency } from '../helpers/utils/confirm-tx.util';
import {
  getMultichainCurrentCurrency,
  getMultichainIsEvm,
  getMultichainNativeCurrency,
  getMultichainConversionRate,
} from '../selectors/multichain';

import { getValueFromWeiHex } from '../../shared/lib/conversion.utils';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  TEST_NETWORK_TICKER_MAP,
} from '../../shared/constants/network';
import { Numeric } from '../../shared/lib/Numeric';
import { EtherDenomination } from '../../shared/constants/common';
import { isEvmChainId } from '../../shared/lib/asset-utils';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { getCurrencyRates } from '../ducks/metamask/metamask';
import { useFormatters } from './useFormatters';
import { useMultichainSelector } from './useMultichainSelector';

// The smallest non-zero amount that can be displayed.
export const MIN_AMOUNT = 0.000001;

// The string to display when 0 < amount < MIN_AMOUNT.
// TODO(dbrans): Localize this string using Intl.NumberFormatter.
const MIN_AMOUNT_DISPLAY = `<${MIN_AMOUNT}`;

// The default precision for displaying currency values.
// It set to the number of decimal places in the minimum amount.
export const DEFAULT_PRECISION = new BigNumber(MIN_AMOUNT).decimalPlaces();

type FormatEthCurrencyDisplayOptions = {
  isNativeCurrency: boolean;
  isUserPreferredCurrency: boolean;
  nativeCurrency: string | undefined;
  inputValue: string | undefined;
  denomination: string | undefined;
  numberOfDecimals: number | undefined;
};

function formatEthCurrencyDisplay({
  isNativeCurrency,
  isUserPreferredCurrency,
  nativeCurrency,
  inputValue,
  denomination,
  numberOfDecimals,
}: FormatEthCurrencyDisplayOptions): string | null {
  if (isNativeCurrency || (!isUserPreferredCurrency && !nativeCurrency)) {
    const ethDisplayValue = new Numeric(inputValue, 16, EtherDenomination.WEI)
      .toDenomination(
        (denomination as EtherDenomination) || EtherDenomination.ETH,
      )
      .round(numberOfDecimals || (DEFAULT_PRECISION as number))
      .toBase(10)
      .toString();

    return ethDisplayValue === '0' && inputValue && Number(inputValue) !== 0
      ? MIN_AMOUNT_DISPLAY
      : ethDisplayValue;
  }
  return null;
}

type FormatNonEvmAssetCurrencyDisplayOptions = {
  tokenSymbol: string | undefined;
  isNativeCurrency: boolean;
  isUserPreferredCurrency: boolean;
  currency: string | undefined;
  currentCurrency: string | undefined;
  nativeCurrency: string | undefined;
  inputValue: string | undefined;
  conversionRate: number | undefined;
};

function formatNonEvmAssetCurrencyDisplay({
  tokenSymbol,
  isNativeCurrency,
  isUserPreferredCurrency,
  currency,
  currentCurrency,
  nativeCurrency,
  inputValue,
  conversionRate,
}: FormatNonEvmAssetCurrencyDisplayOptions): string | null {
  if (isNativeCurrency || (!isUserPreferredCurrency && !nativeCurrency)) {
    // NOTE: We use the value coming from the MultichainBalancesController here (and thus, the non-EVM
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
    return deprecatedFormatCurrency(amount, currency);
  }
  return null;
}

/**
 * Defines the shape of the options parameter for useCurrencyDisplay
 */
export type UseCurrencyOptions = {
  /** When present is used in lieu of formatting the inputValue */
  displayValue?: string;
  /** String to prepend to the final result */
  prefix?: string;
  /** Number of significant decimals to display */
  numberOfDecimals?: number;
  /** Denomination (wei, gwei) to convert to for display */
  denomination?: string;
  /** Currency type to convert to. Will override nativeCurrency */
  currency?: string;
  /** Hide the currency label */
  hideLabel?: boolean;
  /** The account object */
  account?: object;
  /** Whether this is an aggregated fiat overview balance */
  isAggregatedFiatOverviewBalance?: boolean;
  /** The suffix to display */
  suffix?: string;
};

/**
 * Defines the return shape of the second value in the tuple
 */
export type CurrencyDisplayParts = {
  /** string to prepend to the value for display */
  prefix?: string;
  /** string representing the value, formatted for display */
  value: string | null;
  /** string to append to the value for display */
  suffix?: string;
};

/**
 * useCurrencyDisplay hook
 *
 * Given a hexadecimal encoded value string and an object of parameters used for formatting the
 * display, produce both a fully formed string and the pieces of that string used for displaying
 * the currency to the user
 *
 * @param inputValue - The value to format for display
 * @param opts - An object for options to format the inputValue
 * @param chainId - chainId to use
 * @returns A tuple of [displayString, CurrencyDisplayParts]
 */
export function useCurrencyDisplay(
  inputValue: string | undefined,
  opts: UseCurrencyOptions,
  chainId: string | null = null,
): [string, CurrencyDisplayParts] {
  const {
    account,
    displayValue,
    prefix,
    numberOfDecimals,
    denomination,
    currency,
    isAggregatedFiatOverviewBalance,
    hideLabel,
    suffix: optsuffix,
  } = opts;
  const { formatCurrency } = useFormatters();
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

  const currencyRates = useMultichainSelector(getCurrencyRates, account);
  const isUserPreferredCurrency = currency === currentCurrency;
  const isNativeCurrency =
    currency === nativeCurrency ||
    currency === CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId as string];

  // Check if the transaction's chain is EVM, not just the account
  const isTransactionOnEvmChain = chainId ? isEvmChainId(chainId) : isEvm;

  // When chainId is provided, use the chain-specific native currency and conversion rate
  // Fall back to account defaults if the chain is not in the predefined map (custom networks)
  const chainNativeCurrency =
    (chainId && CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId]) || nativeCurrency;
  const chainConversionRate =
    (currencyRates as Record<string, { conversionRate?: number } | undefined>)?.[chainNativeCurrency as string]
      ?.conversionRate ?? conversionRate;

  const value = useMemo(() => {
    if (displayValue) {
      return displayValue;
    }

    if (!isTransactionOnEvmChain && !isAggregatedFiatOverviewBalance) {
      return formatNonEvmAssetCurrencyDisplay({
        tokenSymbol: chainNativeCurrency,
        isNativeCurrency,
        isUserPreferredCurrency,
        currency,
        currentCurrency,
        nativeCurrency: chainNativeCurrency,
        inputValue,
        conversionRate: chainConversionRate as number | undefined,
      });
    }

    if (isAggregatedFiatOverviewBalance) {
      return formatCurrency(inputValue, currency);
    }

    if (!isNativeCurrency && isUserPreferredCurrency && chainConversionRate) {
      const valueFromHex = getValueFromWeiHex({
        value: inputValue,
        fromCurrency: chainNativeCurrency,
        toCurrency: currency,
        conversionRate: chainConversionRate as number,
        numberOfDecimals: numberOfDecimals || 2,
        toDenomination: denomination,
      });
      return formatCurrency(valueFromHex, currency);
    }

    return formatEthCurrencyDisplay({
      isNativeCurrency,
      isUserPreferredCurrency,
      nativeCurrency: chainNativeCurrency,
      inputValue,
      denomination,
      numberOfDecimals,
    });
  }, [
    displayValue,
    isTransactionOnEvmChain,
    isNativeCurrency,
    isUserPreferredCurrency,
    currency,
    chainNativeCurrency,
    inputValue,
    chainConversionRate,
    denomination,
    numberOfDecimals,
    currentCurrency,
    isAggregatedFiatOverviewBalance,
    formatCurrency,
  ]);

  let suffix: string | undefined;

  // Don't add suffix to fiat currencies
  const isFiatCurrency = isAggregatedFiatOverviewBalance || !isNativeCurrency;

  if (!hideLabel && !isFiatCurrency) {
    // if the currency we are displaying is the native currency of one of our preloaded test-nets (goerli, sepolia etc.)
    // then we allow lowercase characters, otherwise we force to uppercase any suffix passed as a currency
    const currencyTickerSymbol = [
      ...Object.values(TEST_NETWORK_TICKER_MAP),
      ...Object.values(MULTICHAIN_NETWORK_TICKER),
    ].includes(currency as string)
      ? currency
      : currency?.toUpperCase();

    suffix = optsuffix || currencyTickerSymbol;
  }

  return [
    `${prefix || ''}${value}${suffix ? ` ${suffix}` : ''}`,
    { prefix, value, suffix },
  ];
}
