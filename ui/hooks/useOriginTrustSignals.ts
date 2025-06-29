import { useSelector } from 'react-redux';
import { RecommendedAction } from '@metamask/phishing-controller';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';

// Based on console log screenshot
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
    case RecommendedAction.None:
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

export function useOriginTrustSignals(origin: string): TrustSignalResult {
  const urlScanCache = useSelector((state: any) => state.metamask.urlScanCache);

  let cachedResult: UrlScanCacheResult | undefined;

  if (origin && urlScanCache) {
    try {
      const domain = new URL(origin).hostname;
      cachedResult = urlScanCache[domain] as UrlScanCacheResult | undefined;
    } catch (e) {
      // Invalid origin URL.
    }
  }

  const state = getTrustState(cachedResult);

  return {
    state: TrustSignalDisplayState.Malicious,
    label: null, // No label for urls
  };
}
