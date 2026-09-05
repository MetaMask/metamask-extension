import { type CurrencyRateState } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { isMusdToken } from '#ui/components/app/musd/constants';
import { type TokenWithFiatAmount } from '#ui/components/app/assets/types';
import { getCurrencyRates, getUseExternalServices } from '../../../../selectors';

const lowValueAssetFiatThresholdUsd = 1;

type CurrencyRates = CurrencyRateState['currencyRates'];

function getLowValueThreshold(currencyRates?: CurrencyRates) {
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
    return lowValueAssetFiatThresholdUsd;
  }

  return (
    (lowValueAssetFiatThresholdUsd * currencyRate.conversionRate) /
    currencyRate.usdConversionRate
  );
}

function hasFiniteTokenFiatAmount(
  token: TokenWithFiatAmount['tokenFiatAmount'],
): token is number {
  return token !== null && token !== undefined && Number.isFinite(token);
}

function shouldBucketAsLowValue(
  token: TokenWithFiatAmount,
  threshold: number,
  hasAnyPricedToken: boolean,
) {
  // Native and mUSD are never bucketed into low value.
  if (token.isNative || isMusdToken(token.address)) {
    return false;
  }

  const { tokenFiatAmount } = token;

  // Priced below $1 in the user's display currency.
  if (
    hasFiniteTokenFiatAmount(tokenFiatAmount) &&
    tokenFiatAmount < threshold
  ) {
    return true;
  }

  // Unpriced tokens when another token in the list has a fiat price.
  if (
    hasAnyPricedToken &&
    (tokenFiatAmount === null || tokenFiatAmount === undefined)
  ) {
    return true;
  }

  return false;
}

function partitionLowValueTokens(
  tokens: TokenWithFiatAmount[],
  currencyRates: CurrencyRates | undefined,
) {
  const threshold = getLowValueThreshold(currencyRates);
  const hasAnyPricedToken = tokens.some((token) =>
    hasFiniteTokenFiatAmount(token.tokenFiatAmount),
  );
  const visibleTokens: TokenWithFiatAmount[] = [];
  const lowValueTokens: TokenWithFiatAmount[] = [];

  tokens.forEach((token) => {
    if (shouldBucketAsLowValue(token, threshold, hasAnyPricedToken)) {
      lowValueTokens.push(token);
      return;
    }

    visibleTokens.push(token);
  });

  return {
    visibleTokens,
    lowValueTokens,
  };
}

/**
 * Splits home token list into visible and low-value buckets. Skips partitioning
 * when sort is inapplicable (`enabled` is false) or basic functionality is off.
 *
 * @param options - Partition inputs.
 * @param options.tokens - Tokens to partition.
 * @param options.enabled - Whether declining-balance sort allows low-value bucketing.
 * @returns Visible tokens and tokens bucketed as low value.
 */
export function useLowValueTokenPartition({
  tokens,
  enabled,
}: {
  tokens: TokenWithFiatAmount[];
  enabled: boolean;
}) {
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRates;
  const allowExternalServices = useSelector(getUseExternalServices);

  if (!enabled || !allowExternalServices) {
    return {
      visibleTokens: tokens,
      lowValueTokens: [],
    };
  }

  return partitionLowValueTokens(tokens, currencyRates);
}
