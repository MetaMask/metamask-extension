import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import type { MultichainTokenScanKey } from '../helpers/utils/token-scan';
import type { MetaMaskReduxState } from '../store/store';
import { getTokenScanCache } from './selectors';
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

export const selectTokenScanResults = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
    (getTokenScanCache(state) as TokenScanCacheResults | undefined) ??
    (EMPTY_OBJECT as TokenScanCacheResults),
  (_state: MetaMaskReduxState, tokenScanCacheKeys?: MultichainTokenScanKey[]) =>
    tokenScanCacheKeys,
  (tokenScanCache, tokenScanCacheKeys): TokenScanCacheResults => {
    if (!tokenScanCacheKeys?.length) {
      return EMPTY_OBJECT as TokenScanCacheResults;
    }

    const results: TokenScanCacheResults = {};

    for (const key of tokenScanCacheKeys) {
      const tokenScanResult = key ? tokenScanCache[key] : undefined;

      if (tokenScanResult) {
        results[key] = tokenScanResult;
      }
    }

    return results;
  },
);
