import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import { SecurityAlertResponse } from '../pages/confirmations/types/confirm';

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

export type UseTrustSignalRequest = {
  value: string;
  type: NameType;
  variation: string;
};

export function useTrustSignal(
  value: string,
  type: NameType,
  variation: string,
): TrustSignalResult | null {
  return useTrustSignals([{ value, type, variation }])[0];
}

export function useTrustSignals(
  requests: UseTrustSignalRequest[],
): (TrustSignalResult | null)[] {
  const securityAlertResponses = useSelector((state) =>
    requests.map(({ value, type }) => {
      if (type !== NameType.ETHEREUM_ADDRESS) {
        return null;
      }
      return getAddressSecurityAlertResponse(state, value);
    }),
  );

  return requests.map((request, index) => {
    const securityAlertResponse = securityAlertResponses[index];

    if (!securityAlertResponse || request.type !== NameType.ETHEREUM_ADDRESS) {
      return null;
    }

    const trustLabel = securityAlertResponse.label || null;
    const trustState = getTrustState(securityAlertResponse);

    if (trustState) {
      return {
        state: trustState,
        trustLabel,
      };
    }

    return null;
  });
}

function getTrustState(
  securityAlertResponse: SecurityAlertResponse,
): TrustSignalDisplayState | null {
  if (!securityAlertResponse.result_type) {
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
    case ResultType.ErrorResult:
      return TrustSignalDisplayState.Unknown;
    default:
      return null;
  }
}
