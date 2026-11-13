import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { setPendingReferral } from '#ui/ducks/rewards-money';
import { selectIsMoneyReferralInviteEnabled } from '#ui/ducks/rewards-money/selectors';
import { DEFAULT_ROUTE } from '#ui/helpers/constants/routes';
import { selectShowTermsOfUse } from '#ui/selectors/home-modals';
import { useAppSelector, useDispatch } from '#ui/store/hooks';
import { AcceptInviteSheet } from '#ui/components/app/rewards/money-referral/AcceptInviteSheet';

/** Displays a pending invite over the authenticated destination. */
export function ReferralInvite() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const pendingReferral = useAppSelector(
    (state) => state.rewardsMoney.pendingReferral,
  );
  const enabled = useAppSelector(selectIsMoneyReferralInviteEnabled);
  const showTermsOfUse = useAppSelector(selectShowTermsOfUse);
  const handleClose = useCallback(() => {
    dispatch(setPendingReferral(null));
  }, [dispatch]);

  const validRoute = !(pathname === DEFAULT_ROUTE && showTermsOfUse);
  return pendingReferral && enabled && validRoute ? (
    <AcceptInviteSheet
      key={pendingReferral.code}
      initialCode={pendingReferral.code}
      entryType={pendingReferral.entryType}
      onClose={handleClose}
    />
  ) : null;
}
