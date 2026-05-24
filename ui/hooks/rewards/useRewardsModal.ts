import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRewardsModalOpen } from '../../ducks/rewards';
import {
  selectRewardsDeeplinkUrl,
  selectRewardsEnabled,
} from '../../ducks/rewards/selectors';
import { useCandidateSubscriptionId } from './useCandidateSubscriptionId';

/**
 * Drives the rewards modal lifecycle: opens the modal whenever a rewards
 * deeplink is present. The modal itself decides whether to show the onboarding
 * form or the QR code based on the user's opt-in state.
 */
export const useRewardsModal = () => {
  const dispatch = useDispatch();

  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsDeeplinkUrl = useSelector(selectRewardsDeeplinkUrl);
  useCandidateSubscriptionId();

  useEffect(() => {
    if (rewardsEnabled && rewardsDeeplinkUrl) {
      dispatch(setRewardsModalOpen(true));
    }
  }, [dispatch, rewardsEnabled, rewardsDeeplinkUrl]);
};
