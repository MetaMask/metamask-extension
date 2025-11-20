import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { Box } from '@metamask/design-system-react';
import LoadingIndicator from '../../components/ui/loading-indicator';
import {
  selectRewardsEnabled,
  selectRewardsOnboardingEnabled,
} from '../../ducks/rewards/selectors';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  setOnboardingModalOpen,
  setOnboardingReferralCode,
} from '../../ducks/rewards';

const RewardsPage: React.FC = () => {
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsOnboardingEnabled = useSelector(selectRewardsOnboardingEnabled);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (rewardsEnabled && rewardsOnboardingEnabled) {
      const params = new URLSearchParams(location.search);
      const referral = params.get('referral');
      if (referral && referral.length > 0) {
        dispatch(setOnboardingReferralCode(referral));
      } else {
        dispatch(setOnboardingReferralCode(null));
      }

      dispatch(setOnboardingModalOpen(true));
    }

    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate, dispatch, rewardsEnabled, rewardsOnboardingEnabled]);

  return (
    <Box className="flex justify-center items-center flex-1">
      <LoadingIndicator
        alt="Loading"
        title="Loading"
        isLoading={true}
        style={{ width: 32, height: 32, left: 5 }}
      />
    </Box>
  );
};

export default RewardsPage;
