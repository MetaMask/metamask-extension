import { useSelector } from 'react-redux';
import { RecommendedAction } from '@metamask/phishing-controller';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';
import {
  getTrustSignalIconForUrl,
  IconProps,
} from '../helpers/utils/trust-signals';
import { IconColor } from '../helpers/constants/design-system';
import { IconName } from '../components/component-library';

// Based on console log screenshot
type UrlScanCacheResult = {
  result: {
    domainName: string;
    recommendedAction: string; // 'NONE', 'WARN', 'BLOCK'
  };
  timestamp: number;
};

export type OriginTrustSignalResult = {
  state: TrustSignalDisplayState;
  icon: IconProps | null;
  label: string | null;
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

export function useOriginTrustSignals(origin: string): OriginTrustSignalResult {
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

  let state = getTrustState(cachedResult);

  state = TrustSignalDisplayState.Verified; // TODO: remove this

  let trustSignalIcon = getTrustSignalIconForUrl(state);

  return {
    state,
    label: null, // No label for urls
    icon: trustSignalIcon,
  };
}
