import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { setPendingReferralCode } from '#ui/ducks/rewards-money';
import { selectIsMoneyReferralInviteEnabled } from '#ui/ducks/rewards-money/selectors';
import { DEFAULT_ROUTE } from '#ui/helpers/constants/routes';
import { selectShowTermsOfUse } from '#ui/selectors/home-modals';
import { useAppSelector, useDispatch } from '#ui/store/hooks';
import { AcceptInviteSheet } from '#ui/components/app/rewards/money-referral/AcceptInviteSheet';

/** Displays a pending invite over the authenticated destination. */
export function ReferralInvite() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const code = useAppSelector(
    (state) => state.rewardsMoney.pendingReferralCode,
  );
  const enabled = useAppSelector(selectIsMoneyReferralInviteEnabled);
  const showTermsOfUse = useAppSelector(selectShowTermsOfUse);
  const handleClose = useCallback(() => {
    dispatch(setPendingReferralCode(null));
  }, [dispatch]);

  const validRoute = !(pathname === DEFAULT_ROUTE && showTermsOfUse);
  return code && enabled && validRoute ? (
    <AcceptInviteSheet key={code} initialCode={code} onClose={handleClose} />
  ) : null;
}
