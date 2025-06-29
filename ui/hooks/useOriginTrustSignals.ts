import { useSelector } from 'react-redux';
import { RecommendedAction } from '@metamask/phishing-controller';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';
import { getUrlScanCacheResult } from '../selectors/selectors';

type UrlScanCacheResult = {
  result: {
    domainName: string;
    recommendedAction: string; // 'NONE', 'WARN', 'BLOCK'
  };
  timestamp: number;
};

function getTrustState(
  cachedResult: UrlScanCacheResult | undefined,
): TrustSignalDisplayState {
  const recommendedAction = cachedResult?.result?.recommendedAction;

  if (!recommendedAction) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (recommendedAction) {
    case RecommendedAction.Block:
      return TrustSignalDisplayState.Malicious;
    case RecommendedAction.Warn:
      return TrustSignalDisplayState.Warning;
    case RecommendedAction.Verified:
      return TrustSignalDisplayState.Verified;
    case RecommendedAction.None:
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

export function useOriginTrustSignals(origin: string): TrustSignalResult {
  const urlScanCacheResult = useSelector((state) =>
    getUrlScanCacheResult(state, origin),
  );

  const state = getTrustState(urlScanCacheResult);

  return {
    state,
    label: null, // No label for urls
  };
}
