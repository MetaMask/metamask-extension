import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  validatedVersionGatedFeatureFlag,
  type VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';
import { isMfaDevBuild } from '../../hooks/identity/mfa/isMfaDevBuild';

/**
 * Whether the MFA screens are reachable: the `mfaUiKit` remote flag
 * (`{ enabled, minimumVersion }`) when valid, otherwise the build check, which
 * hides them in production builds.
 */
export const getIsMfaUiKitEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean =>
    validatedVersionGatedFeatureFlag(
      remoteFeatureFlags?.mfaUiKit as VersionGatedFeatureFlag | undefined,
    ) ?? isMfaDevBuild(),
);
