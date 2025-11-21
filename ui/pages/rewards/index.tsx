import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { Box } from '@metamask/design-system-react';
import LoadingIndicator from '../../components/ui/loading-indicator';
import {
  selectCandidateSubscriptionId,
  selectRewardsEnabled,
  selectRewardsOnboardingEnabled,
} from '../../ducks/rewards/selectors';
import { useCandidateSubscriptionId } from '../../hooks/rewards/useCandidateSubscriptionId';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  setOnboardingModalOpen,
  setOnboardingReferralCode,
} from '../../ducks/rewards';
import RewardsOnboardingModal from '../../components/app/rewards/onboarding/OnboardingModal';

const RewardsPage: React.FC = () => {
  const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsOnboardingEnabled = useSelector(selectRewardsOnboardingEnabled);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectOnClose = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  useCandidateSubscriptionId();

  // Capture referral code from URL on mount and store in Redux for onboarding
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referral = params.get('referral');
    if (referral && referral.length > 0) {
      dispatch(setOnboardingReferralCode(referral));
    } else {
      dispatch(setOnboardingReferralCode(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Redirect to homepage if candidateSubscriptionId is found or error
    if (
      !rewardsEnabled ||
      !rewardsOnboardingEnabled ||
      (candidateSubscriptionId &&
        candidateSubscriptionId !== 'pending' &&
        candidateSubscriptionId !== 'retry')
    ) {
      navigate(DEFAULT_ROUTE, { replace: true });
    } else if (!candidateSubscriptionId) {
      // else open the rewards onboarding modal
      dispatch(setOnboardingModalOpen(true));
    }
  }, [candidateSubscriptionId, navigate, dispatch]);

  return (
    <Box className="flex justify-center items-center flex-1">
      <LoadingIndicator
        alt="Loading"
        title="Loading"
        isLoading={true}
        style={{ width: 32, height: 32, left: 5 }}
      />
      <RewardsOnboardingModal onClose={redirectOnClose} />
    </Box>
  );
};

export default RewardsPage;
