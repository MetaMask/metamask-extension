import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@metamask/design-system-react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/ui/loading-indicator';
import { selectRewardsEnabled } from '../../ducks/rewards/selectors';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  setOnboardingReferralCode,
  setRewardsDeeplinkUrl,
} from '../../ducks/rewards';
import { REWARDS_DEEPLINK_HOST } from '../../components/app/rewards/utils/constants';

const RewardsPage: React.FC = () => {
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (rewardsEnabled) {
      const params = new URLSearchParams(location.search);
      const referral = params.get('referral');
      if (referral && referral.length > 0) {
        dispatch(setOnboardingReferralCode(referral));
      } else {
        dispatch(setOnboardingReferralCode(null));
      }

      dispatch(
        setRewardsDeeplinkUrl(
          REWARDS_DEEPLINK_HOST + location.pathname + location.search,
        ),
      );
    }

    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate, dispatch, rewardsEnabled, location]);

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
