import { useSelector } from 'react-redux';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../shared/constants/app';
import {
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsSocialLoginFlow,
} from '../selectors';

/**
 * Whether the current side panel environment cannot run WebAuthn for the
 * enrolled passkey authenticator.
 */
export function useIsPasskeyIncompatibleInSidepanel(): boolean {
  const isEnrolledPasskeyIncompatibleWithSidepanel = useSelector(
    getIsEnrolledPasskeyIncompatibleWithSidepanel,
  );

  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
  return isSidePanel && isEnrolledPasskeyIncompatibleWithSidepanel;
}

/**
 * Whether passkey is enrolled and the passkey feature is available.
 */
export function useIsPasskeyActive(): boolean {
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  return isPasskeyRegistered && isPasskeyFeatureAvailable && !isSocialLoginFlow;
}
