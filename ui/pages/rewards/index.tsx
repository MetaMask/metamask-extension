import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@metamask/design-system-react';
import { useLocation } from 'react-router-dom';
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

type RewardsPageProps = {
  navigate: (to: string, options?: { replace?: boolean }) => void;
  location: Location;
};

const RewardsPage: React.FC<RewardsPageProps> = ({ navigate, location }) => {
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const hookLocation = useLocation();
  const rewardsOnboardingEnabled = useSelector(selectRewardsOnboardingEnabled);
  const dispatch = useDispatch();

  useEffect(() => {
    if (rewardsEnabled && rewardsOnboardingEnabled) {
      const localLocation = location ?? hookLocation;
      const params = localLocation
        ? new URLSearchParams(localLocation.search)
        : new URLSearchParams();
      const referral = params.get('referral');
      if (referral && referral.length > 0) {
        dispatch(setOnboardingReferralCode(referral));
      } else {
        dispatch(setOnboardingReferralCode(null));
      }

      dispatch(setOnboardingModalOpen(true));
    }

    navigate(DEFAULT_ROUTE, { replace: true });
  }, [
    navigate,
    dispatch,
    rewardsEnabled,
    rewardsOnboardingEnabled,
    location,
    hookLocation,
  ]);

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
