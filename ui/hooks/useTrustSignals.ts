import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import { useDisplayName } from './useDisplayName';

export enum TrustSignalDisplayState {
  Malicious = 'malicious',
  Petname = 'petname',
  Verified = 'verified',
  Warning = 'warning',
  Recognized = 'recognized',
  Unknown = 'unknown',
}

export type TrustSignalResult = {
  state: TrustSignalDisplayState;
  trustLabel: string | null;
};

export function useTrustSignals(
  value: string,
  type: NameType,
  variation: string,
  showTrustSignals: boolean,
): TrustSignalResult {
  // Fetch security alert response from Redux state
  const securityAlertResponse = useSelector((state) =>
    getAddressSecurityAlertResponse(state, value),
  );

  // Get existing name data
  const { name: displayName, hasPetname } = useDisplayName({
    value,
    type,
    variation,
  });

  const trustLabel = securityAlertResponse?.label || null;

  // Map security alert result type to trust signal display state
  const getTrustState = () => {
    if (!securityAlertResponse?.result_type) {
      return null;
    }

    switch (securityAlertResponse.result_type) {
      case ResultType.Malicious:
        return TrustSignalDisplayState.Malicious;
      case ResultType.Warning:
        return TrustSignalDisplayState.Warning;
      case ResultType.Trusted:
        return TrustSignalDisplayState.Verified;
      case ResultType.Benign:
        return TrustSignalDisplayState.Unknown;
      case ResultType.ErrorResult:
        return TrustSignalDisplayState.Unknown;
      default:
        return null;
    }
  };

  const trustState = getTrustState();

  // Priority 1: Malicious takes precedence over everything when trust signals are enabled
  if (showTrustSignals && trustState === TrustSignalDisplayState.Malicious) {
    return {
      state: TrustSignalDisplayState.Malicious,
      trustLabel,
    };
  }

  // Priority 2: Saved petname (for non-malicious entities)
  if (hasPetname) {
    return {
      state: TrustSignalDisplayState.Petname,
      trustLabel,
    };
  }

  // Priority 3-5: Other trust signal states (when enabled and present)
  if (showTrustSignals && trustState) {
    switch (trustState) {
      case TrustSignalDisplayState.Verified:
        return {
          state: TrustSignalDisplayState.Verified,
          trustLabel,
        };
      case TrustSignalDisplayState.Warning:
        return {
          state: TrustSignalDisplayState.Warning,
          trustLabel,
        };
      case TrustSignalDisplayState.Unknown:
        return {
          state: TrustSignalDisplayState.Unknown,
          trustLabel,
        };
      default:
        break;
    }
  }

  // Priority 6: Recognized name (no petname, no applicable trust signals)
  if (displayName) {
    return {
      state: TrustSignalDisplayState.Recognized,
      trustLabel,
    };
  }

  // Priority 7: Unknown (default)
  return {
    state: TrustSignalDisplayState.Unknown,
    trustLabel,
  };
}
