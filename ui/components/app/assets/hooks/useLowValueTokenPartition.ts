import { type CurrencyRateState } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import {
  getCurrencyRates,
  getUseExternalServices,
} from '../../../../selectors';
import { isMusdToken } from '../../musd/constants';
import { type TokenWithFiatAmount } from '../types';

const lowValueAssetFiatThresholdUsd = 1;

type CurrencyRates = CurrencyRateState['currencyRates'];

function getLowValueAssetFiatThreshold(currencyRates?: CurrencyRates) {
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
  tokenFiatAmount: TokenWithFiatAmount['tokenFiatAmount'],
): tokenFiatAmount is number {
  return (
    tokenFiatAmount !== null &&
    tokenFiatAmount !== undefined &&
    Number.isFinite(tokenFiatAmount)
  );
}

function shouldBucketAsLowValue(
  token: TokenWithFiatAmount,
  threshold: number,
  allowExternalServices: boolean,
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

  // Unpriced tokens — only when basic functionality is on and prices look healthy.
  if (
    allowExternalServices &&
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
  allowExternalServices: boolean,
) {
  const threshold = getLowValueAssetFiatThreshold(currencyRates);
  const hasAnyPricedToken = tokens.some((token) =>
    hasFiniteTokenFiatAmount(token.tokenFiatAmount),
  );
  const visibleTokens: TokenWithFiatAmount[] = [];
  const lowValueTokens: TokenWithFiatAmount[] = [];

  tokens.forEach((token) => {
    if (
      shouldBucketAsLowValue(
        token,
        threshold,
        allowExternalServices,
        hasAnyPricedToken,
      )
    ) {
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

export function useLowValueTokenPartition({
  tokens,
  enabled,
}: {
  tokens: TokenWithFiatAmount[];
  enabled: boolean;
}) {
  const currencyRates = useSelector(getCurrencyRates);
  // Basic functionality toggle — when off, unpriced tokens stay in the main list.
  const allowExternalServices = useSelector(getUseExternalServices);

  if (!enabled) {
    return {
      visibleTokens: tokens,
      lowValueTokens: [],
    };
  }

  return partitionLowValueTokens(tokens, currencyRates, allowExternalServices);
}
