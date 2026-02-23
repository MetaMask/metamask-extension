import { RecommendedAction } from '@metamask/phishing-controller';
import { useSelector } from 'react-redux';
import { getUrlScanCacheResult } from '../selectors/selectors';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';

type UrlScanCacheResult = {
  data: {
    hostname?: string;
    recommendedAction: string;
  };
  timestamp: number;
};

function getTrustState(
  cachedResult: UrlScanCacheResult | undefined,
): TrustSignalDisplayState {
  const recommendedAction = cachedResult?.data?.recommendedAction;

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

// TODO: TEMPORARY — remove after testing. Maps hostnames to trust states.
const TEST_TRUST_OVERRIDES: Record<string, TrustSignalDisplayState> = {
  'app.uniswap.org': TrustSignalDisplayState.Verified,
  'pancakeswap.finance': TrustSignalDisplayState.Warning,
  'revoke.cash': TrustSignalDisplayState.Malicious,
};

export function useOriginTrustSignals(origin: string): TrustSignalResult {
  let hostname: string | undefined;

  if (origin) {
    try {
      const url = origin.includes('://') ? origin : `https://${origin}`;
      hostname = new URL(url).hostname;
    } catch (e) {
      hostname = undefined;
    }
  }

  const urlScanCacheResult = useSelector((state) =>
    getUrlScanCacheResult(state, hostname),
  );

  // TODO: TEMPORARY — remove after testing. Use override if available.
  const override = hostname ? TEST_TRUST_OVERRIDES[hostname] : undefined;
  const state = override ?? getTrustState(urlScanCacheResult);

  return {
    state,
    label: null,
  };
}
