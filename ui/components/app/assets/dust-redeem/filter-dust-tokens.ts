import type { CurrencyRateState } from '@metamask/assets-controllers';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { isMusdToken } from '../../musd/constants';
import type { TokenWithFiatAmount } from '../types';

export const DUST_BALANCE_THRESHOLDS_USD = [1, 5, 10] as const;

export type DustBalanceThresholdUsd =
  (typeof DUST_BALANCE_THRESHOLDS_USD)[number];

type CurrencyRates = CurrencyRateState['currencyRates'];

/**
 * Converts a USD ceiling into the user's display currency.
 * Falls back to the USD amount when a usable rate is missing, matching the
 * low balance token partition.
 *
 * @param usdAmount - Ceiling in US dollars.
 * @param currencyRates - Rates for the user's display currency.
 * @returns The ceiling in display-currency units.
 */
export function getDustFiatThreshold(
  usdAmount: number,
  currencyRates?: CurrencyRates | null,
): number {
  const currencyRate = Object.values(currencyRates ?? {}).find(
    ({ conversionRate, usdConversionRate }) =>
      typeof conversionRate === 'number' &&
      typeof usdConversionRate === 'number' &&
      Number.isFinite(conversionRate) &&
      Number.isFinite(usdConversionRate) &&
      conversionRate > 0 &&
      usdConversionRate > 0,
  );

  if (!currencyRate?.conversionRate || !currencyRate.usdConversionRate) {
    return usdAmount;
  }

  return (
    (usdAmount * currencyRate.conversionRate) / currencyRate.usdConversionRate
  );
}

type DustTokenFilter = {
  thresholdUsd: number;
  includeGasTokens: boolean;
  currencyRates?: CurrencyRates | null;
};

/**
 * EVM tokens the redeem modal can offer.
 * mUSD is excluded. Gas tokens are included only when requested. Unpriced
 * tokens are included. Tokens with a zero balance are excluded.
 *
 * @param tokens - Account tokens to filter.
 * @param filter - Ceiling, gas-token toggle, and display-currency rates.
 * @param filter.thresholdUsd - Ceiling in US dollars.
 * @param filter.includeGasTokens - Whether native gas tokens are eligible.
 * @param filter.currencyRates - Rates for the user's display currency.
 * @returns Tokens whose fiat balance is under the ceiling.
 */
export function filterDustTokens(
  tokens: TokenWithFiatAmount[],
  { thresholdUsd, includeGasTokens, currencyRates }: DustTokenFilter,
): TokenWithFiatAmount[] {
  const threshold = getDustFiatThreshold(thresholdUsd, currencyRates);

  return tokens.filter((token) => {
    if (!isEvmChainId(token.chainId) || isMusdToken(token.address)) {
      return false;
    }

    if (token.isNative && !includeGasTokens) {
      return false;
    }

    const balance = Number(token.balance);
    if (
      token.balance !== undefined &&
      Number.isFinite(balance) &&
      balance === 0
    ) {
      return false;
    }

    const { tokenFiatAmount } = token;

    if (tokenFiatAmount === null || tokenFiatAmount === undefined) {
      return true;
    }

    return Number.isFinite(tokenFiatAmount) && tokenFiatAmount < threshold;
  });
}

/**
 * @param value - Candidate ceiling from the balance dropdown.
 * @returns Whether the value is one of the supported ceilings.
 */
export function isDustBalanceThreshold(
  value: number,
): value is DustBalanceThresholdUsd {
  return (DUST_BALANCE_THRESHOLDS_USD as readonly number[]).includes(value);
}
