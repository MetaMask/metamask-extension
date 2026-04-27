import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import type { MultichainTokenScanKey } from '../helpers/utils/token-scan';
import type { MetaMaskReduxState } from '../store/store';
import { EMPTY_OBJECT } from './shared';

type TokenScanCacheResult = {
  data?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type?: string;
  };
  timestamp?: number;
};

export type TokenScanCacheResults = Record<
  MultichainTokenScanKey,
  TokenScanCacheResult
>;

type MetaMaskWithTokenScanCache = {
  tokenScanCache?: TokenScanCacheResults;
};

const getTokenScanCache = (
  state: MetaMaskReduxState,
): TokenScanCacheResults => {
  const metamaskState = state.metamask as unknown as
    | MetaMaskWithTokenScanCache
    | undefined;

  return (
    metamaskState?.tokenScanCache ?? (EMPTY_OBJECT as TokenScanCacheResults)
  );
};

export const getTokenScanResultsForCacheKeys = createDeepEqualSelector(
  getTokenScanCache,
  (_state: MetaMaskReduxState, tokenScanCacheKeys?: MultichainTokenScanKey[]) =>
    tokenScanCacheKeys,
  (tokenScanCache, tokenScanCacheKeys): TokenScanCacheResults => {
    if (!tokenScanCacheKeys?.length) {
      return EMPTY_OBJECT as TokenScanCacheResults;
    }

    const tokenScanResults: TokenScanCacheResults = {};

    for (const tokenScanCacheKey of tokenScanCacheKeys) {
      const tokenScanResult = tokenScanCacheKey
        ? tokenScanCache[tokenScanCacheKey]
        : undefined;

      if (tokenScanResult) {
        tokenScanResults[tokenScanCacheKey] = tokenScanResult;
      }
    }

    return tokenScanResults;
  },
);
