import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getTokenScanCacheResult,
  getTokenScanCacheResults,
} from '../selectors/selectors';
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
    case 'Suspicious':
      return TrustSignalDisplayState.Warning;
    case 'Benign':
    case 'Verified':
      return TrustSignalDisplayState.Verified;
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

export function useTokenTrustSignals(
  chainId: string | undefined,
  tokenAddress: string | undefined,
): TrustSignalResult {
  const tokenScanCacheResult = useSelector((state) =>
    getTokenScanCacheResult(state, chainId, tokenAddress),
  );

  const state = getTrustState(tokenScanCacheResult);

  return {
    state,
    label: null,
  };
}

export function useTokenTrustSignalsForAddresses(
  chainId: string | undefined,
  tokenAddresses: string[] | undefined,
): TrustSignalResult[] {
  const tokenScanCacheResults = useSelector((state) =>
    getTokenScanCacheResults(state, chainId, tokenAddresses),
  );

  return useMemo(() => {
    return tokenScanCacheResults.map((result) => ({
      state: getTrustState(result),
      label: null,
    }));
  }, [tokenScanCacheResults]);
}
