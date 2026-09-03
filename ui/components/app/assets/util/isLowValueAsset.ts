import { isMusdToken } from '../../musd/constants';
import { type TokenWithFiatAmount } from '../types';

type LowValueBucketReason = 'underThreshold' | 'unpriced';

type LowValueAssetOptions = {
  lowValueAssetFiatThreshold: number;
  useExternalServices: boolean;
  hasAnyPricedToken: boolean;
};

export type PartitionLowValueTokensOptions = {
  lowValueAssetFiatThreshold: number;
  useExternalServices: boolean;
};

export type PartitionLowValueTokensResult = {
  visibleTokens: TokenWithFiatAmount[];
  lowValueTokens: TokenWithFiatAmount[];
};

const hasFiniteTokenFiatAmount = (
  tokenFiatAmount: TokenWithFiatAmount['tokenFiatAmount'],
): tokenFiatAmount is number =>
  tokenFiatAmount !== null &&
  tokenFiatAmount !== undefined &&
  Number.isFinite(tokenFiatAmount);

const hasAnyPricedTokenInList = (
  tokens: Pick<TokenWithFiatAmount, 'tokenFiatAmount'>[],
) => tokens.some((token) => hasFiniteTokenFiatAmount(token.tokenFiatAmount));

const isExcludedFromLowValueBucket = (token: TokenWithFiatAmount) =>
  token.isNative || isMusdToken(token.address);

const isMissingTokenFiatAmount = (
  tokenFiatAmount: TokenWithFiatAmount['tokenFiatAmount'],
) => tokenFiatAmount === null || tokenFiatAmount === undefined;

const getLowValueBucketReason = (
  token: TokenWithFiatAmount,
  {
    lowValueAssetFiatThreshold,
    useExternalServices,
    hasAnyPricedToken,
  }: LowValueAssetOptions,
): LowValueBucketReason | null => {
  if (isExcludedFromLowValueBucket(token)) {
    return null;
  }

  const { tokenFiatAmount } = token;

  if (
    hasFiniteTokenFiatAmount(tokenFiatAmount) &&
    tokenFiatAmount < lowValueAssetFiatThreshold
  ) {
    return 'underThreshold';
  }

  if (
    useExternalServices &&
    hasAnyPricedToken &&
    isMissingTokenFiatAmount(tokenFiatAmount)
  ) {
    return 'unpriced';
  }

  return null;
};

export function partitionLowValueTokens(
  tokens: TokenWithFiatAmount[],
  {
    lowValueAssetFiatThreshold,
    useExternalServices,
  }: PartitionLowValueTokensOptions,
): PartitionLowValueTokensResult {
  const lowValueBucketOptions = {
    lowValueAssetFiatThreshold,
    useExternalServices,
    hasAnyPricedToken: hasAnyPricedTokenInList(tokens),
  };

  const visibleTokens: TokenWithFiatAmount[] = [];
  const lowValueTokens: TokenWithFiatAmount[] = [];

  tokens.forEach((token) => {
    if (getLowValueBucketReason(token, lowValueBucketOptions)) {
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
