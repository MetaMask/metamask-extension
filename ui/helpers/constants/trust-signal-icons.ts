import { IconName } from '../../components/component-library';
import { TrustSignalState } from '../../hooks/useTrustSignals';

/**
 * Maps trust signal states to their corresponding icon names
 */
export const TRUST_STATE_TO_ICON: Record<TrustSignalState, IconName> = {
  [TrustSignalState.Verified]: IconName.VerifiedFilled,
  [TrustSignalState.Warning]: IconName.Warning,
  [TrustSignalState.Malicious]: IconName.Danger,
  [TrustSignalState.Unknown]: IconName.Question,
};
