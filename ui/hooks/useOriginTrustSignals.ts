import { RecommendedAction } from '@metamask/phishing-controller';
import { useSelector } from 'react-redux';
import { getUrlScanCacheResult } from '../selectors/selectors';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';

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
  let hostname: string | undefined;

  if (origin) {
    try {
      const url = new URL(origin);
      hostname = url.hostname;
    } catch (e) {
      hostname = undefined;
    }
  }

  const urlScanCacheResult = useSelector((state) =>
    getUrlScanCacheResult(state, hostname),
  );

  const state = getTrustState(urlScanCacheResult);

  return {
    state,
    label: null,
  };
}
