import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import { SecurityAlertResponse } from '../pages/confirmations/types/confirm';

export type UseTrustSignalRequest = {
  value: string;
  type: NameType;
  variation: string;
};

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
  label: string | null;
};

export function useTrustSignal(
  value: string,
  type: NameType,
  variation: string,
): TrustSignalResult {
  return useTrustSignals([{ value, type, variation }])[0];
}

export function useTrustSignals(
  requests: UseTrustSignalRequest[],
): TrustSignalResult[] {
  return useSelector((state) =>
    requests.map(({ value, type }) => {
      if (type !== NameType.ETHEREUM_ADDRESS) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      const securityAlertResponse = getAddressSecurityAlertResponse(
        state,
        value,
      );

      if (!securityAlertResponse) {
        return {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        };
      }

      const label = securityAlertResponse.label || null;
      const trustState = getTrustState(securityAlertResponse);

      return {
        state: trustState,
        label,
      };
    }),
  );
}

function getTrustState(
  securityAlertResponse: SecurityAlertResponse,
): TrustSignalDisplayState {
  if (!securityAlertResponse.result_type) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (securityAlertResponse.result_type) {
    case ResultType.Malicious:
      return TrustSignalDisplayState.Malicious;
    case ResultType.Warning:
      return TrustSignalDisplayState.Warning;
    case ResultType.Trusted:
      return TrustSignalDisplayState.Verified;
    case ResultType.Benign:
    case ResultType.ErrorResult:
    default:
      return TrustSignalDisplayState.Unknown;
  }
}
