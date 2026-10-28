import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  isProgressiveRolloutWrapper,
  validatedVersionGatedFeatureFlag,
} from '../../../shared/lib/remote-feature-flag-utils';
import type { MfaMethod } from '../../hooks/identity/mfa/engine/types';
import { isMfaDevBuild } from '../../hooks/identity/mfa/isMfaDevBuild';

/**
 * Whether the MFA screens are reachable: the `mfaUiKit` remote flag
 * (`{ enabled, minimumVersion }`) when valid, otherwise the build check, which
 * hides them in production builds.
 */
export const getIsMfaUiKitEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean =>
    validatedVersionGatedFeatureFlag(remoteFeatureFlags?.mfaUiKit) ??
    isMfaDevBuild(),
);

const ALL_METHODS: MfaMethod[] = ['passkey', 'totp', 'email_otp'];

/**
 * Methods users may add in the MFA settings: the `mfaUiKit` flag's `methods`,
 * or all of them. Methods already set up stay listed.
 */
export const getMfaUiKitMethods = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): MfaMethod[] => {
    const flag = remoteFeatureFlags?.mfaUiKit;
    const { methods } = (
      isProgressiveRolloutWrapper(flag) ? flag.value : (flag ?? {})
    ) as { methods?: unknown };
    return Array.isArray(methods) ? (methods as MfaMethod[]) : ALL_METHODS;
  },
);
