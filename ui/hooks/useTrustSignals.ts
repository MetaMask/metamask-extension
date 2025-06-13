import { useSelector } from 'react-redux';
import { getAddressSecurityAlertResponse } from '../selectors/selectors';
import { IconName } from '../components/component-library';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';

export enum TrustSignalState {
  Verified = 'verified',
  Warning = 'warning',
  Malicious = 'malicious',
  Unknown = 'unknown',
}

export type TrustSignalData = {
  state: TrustSignalState | null;
  label?: string;
  iconName?: IconName;
};

const RESULT_TYPE_TO_STATE_MAP: Record<ResultType, TrustSignalState> = {
  [ResultType.Trusted]: TrustSignalState.Verified,
  [ResultType.Benign]: TrustSignalState.Unknown,
  [ResultType.Warning]: TrustSignalState.Warning,
  [ResultType.Malicious]: TrustSignalState.Malicious,
  [ResultType.ErrorResult]: TrustSignalState.Unknown,
};

const STATE_TO_ICON_MAP: Record<TrustSignalState, IconName> = {
  [TrustSignalState.Verified]: IconName.VerifiedFilled,
  [TrustSignalState.Warning]: IconName.Warning,
  [TrustSignalState.Malicious]: IconName.Danger,
  [TrustSignalState.Unknown]: IconName.Question,
};

/**
 * Hook to get trust signal data for an address
 *
 * @param address - The address to get trust signals for
 * @returns Trust signal data including state, label, and icon
 */
export function useTrustSignals(address: string): TrustSignalData {
  const securityAlertResponse = useSelector((state) =>
    getAddressSecurityAlertResponse(state, address),
  );

  if (!securityAlertResponse) {
    return { state: null };
  }

  const state = RESULT_TYPE_TO_STATE_MAP[securityAlertResponse.result_type];
  const iconName = STATE_TO_ICON_MAP[state];

  return {
    state,
    label: securityAlertResponse.label,
    iconName,
  };
}
