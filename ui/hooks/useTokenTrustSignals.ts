import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getTokenScanResultsForAddresses } from '../selectors/selectors';
import { generateTokenCacheKey } from '../helpers/utils/token-cache-utils';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';

type TokenScanCacheResult = {
  data: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type?: string;
  };
  timestamp?: number;
};

function getTrustState(
  cachedResult: TokenScanCacheResult | undefined,
): TrustSignalDisplayState {
  const resultType = cachedResult?.data?.result_type;

  if (!resultType) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (resultType) {
    case 'Malicious':
      return TrustSignalDisplayState.Malicious;
    case 'Warning':
      return TrustSignalDisplayState.Warning;
    case 'Benign':
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

export function useTokenTrustSignalsForAddresses(
  chainId: string | undefined,
  tokenAddresses: string[] | undefined,
): TrustSignalResult[] {
  const tokenScanResults = useSelector((state) =>
    getTokenScanResultsForAddresses(state, chainId, tokenAddresses),
  ) as Record<string, TokenScanCacheResult>;

  return useMemo(() => {
    if (!chainId || !tokenAddresses || !Array.isArray(tokenAddresses)) {
      return [];
    }

    return tokenAddresses.map((tokenAddress) => {
      if (!tokenAddress) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      const cacheKey = generateTokenCacheKey(chainId, tokenAddress);
      const cachedResult = tokenScanResults[cacheKey];

      return {
        state: getTrustState(cachedResult),
        label: null,
      };
    });
  }, [chainId, tokenAddresses, tokenScanResults]);
}
