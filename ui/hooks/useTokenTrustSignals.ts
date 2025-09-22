import { useSelector } from 'react-redux';
import { getTokenScanCacheResult } from '../selectors/selectors';
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

  switch (resultType.toLowerCase()) {
    case 'malicious':
      return TrustSignalDisplayState.Malicious;
    case 'warning':
    case 'suspicious':
      return TrustSignalDisplayState.Warning;
    case 'benign':
    case 'verified':
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
