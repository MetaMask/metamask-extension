import { useMemo } from 'react';
import { useQuery } from '@metamask/react-data-query';
import {
  getPhishingDetectionScanUrlParam,
  RecommendedAction,
  type PhishingDetectionScanResult,
} from '@metamask/phishing-controller';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';

function getTrustState(
  recommendedAction: RecommendedAction | undefined,
): TrustSignalDisplayState {
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

/**
 * Hook to get trust signals for an origin URL. The scan result is read from
 * (and kept fresh by) the PhishingDataService query cache.
 *
 * @param origin - The origin URL to check.
 * @returns The trust signal state, and a null label since origins have none.
 */
export function useOriginTrustSignals(origin: string): TrustSignalResult {
  // The same parameter `PhishingController.scanUrl` derives, so the UI shares
  // the cache entry the background scan primes rather than keying a second one.
  const scanUrlParam = useMemo(() => {
    if (!origin) {
      return undefined;
    }

    const [param, ok] = getPhishingDetectionScanUrlParam(origin);
    return ok ? param : undefined;
  }, [origin]);

  const { data: scanResult } = useQuery<PhishingDetectionScanResult>({
    // The key must stay a `[string, ...Json[]]`, so the parameter is stubbed
    // while it is unknown. The query is disabled then, so the stub key is
    // never fetched against.
    queryKey: ['PhishingDataService:scanUrl', scanUrlParam ?? ''],
    enabled: Boolean(scanUrlParam),
  });

  const state = useMemo(
    () => getTrustState(scanResult?.recommendedAction),
    [scanResult],
  );

  return {
    state,
    label: null,
  };
}
