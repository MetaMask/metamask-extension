import React, { useCallback } from 'react';
import { getRemoteFeatureFlags } from '#shared/lib/selectors/remote-feature-flags';
import {
  validatedVersionGatedFeatureFlag,
  type VersionGatedFeatureFlag,
} from '#shared/lib/feature-flags/version-gating';
import { setPendingReferralCode } from '#ui/ducks/rewards-money';
import { useAppSelector, useDispatch } from '#ui/store/hooks';
import { AcceptInviteSheet } from '#ui/components/app/rewards/money-referral/AcceptInviteSheet';

/** Displays a pending invite over the authenticated destination. */
export function ReferralInvite() {
  const dispatch = useDispatch();
  const code = useAppSelector(
    (state) => state.rewardsMoney.pendingReferralCode,
  );
  const useExternalServices = useAppSelector(
    ({ metamask }) => metamask.useExternalServices,
  );
  const flags = useAppSelector(getRemoteFeatureFlags);
  const enabled = validatedVersionGatedFeatureFlag(
    flags.rewardsMoneyControllerEnabled as VersionGatedFeatureFlag,
  );
  const handleClose = useCallback(() => {
    dispatch(setPendingReferralCode(null));
  }, [dispatch]);

  return code && useExternalServices && enabled ? (
    <AcceptInviteSheet key={code} initialCode={code} onClose={handleClose} />
  ) : null;
}
