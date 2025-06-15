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

export function useTrustSignals(
  value: string,
  type: NameType,
  variation: string,
  showTrustSignals: boolean,
): TrustSignalDisplayState {
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

  // Map security alert result type to trust state
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

  // Apply priority logic to determine final display state

  // Priority 1: Malicious takes precedence over everything when trust signals are enabled
  if (showTrustSignals && trustState === TrustSignalDisplayState.Malicious) {
    return TrustSignalDisplayState.Malicious;
  }

  // Priority 2: Saved petname (for non-malicious entities)
  if (hasPetname) {
    return TrustSignalDisplayState.Petname;
  }

  // Priority 3-5: Other trust signal states (when enabled and present)
  if (showTrustSignals && trustState) {
    switch (trustState) {
      case TrustSignalDisplayState.Verified:
        return TrustSignalDisplayState.Verified;
      case TrustSignalDisplayState.Warning:
        return TrustSignalDisplayState.Warning;
      case TrustSignalDisplayState.Unknown:
        return TrustSignalDisplayState.Unknown;
      default:
        break;
    }
  }

  // Priority 6: Recognized name (no petname, no applicable trust signals)
  if (displayName) {
    return TrustSignalDisplayState.Recognized;
  }

  // Priority 7: Unknown (default)
  return TrustSignalDisplayState.Unknown;
}
