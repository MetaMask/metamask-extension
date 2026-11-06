import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { setRewardsModalOpen } from '../../ducks/rewards';
import {
  selectRewardsDeepLinkUrl,
  selectRewardsEnabled,
} from '../../ducks/rewards/selectors';
import { useDispatch } from '../../store/hooks';
import { useCandidateSubscriptionId } from './useCandidateSubscriptionId';

/**
 * Drives the rewards modal lifecycle: opens the modal whenever a rewards
 * deep link is present. The modal itself decides whether to show the onboarding
 * form or the QR code based on the user's opt-in state.
 */
export const useRewardsModal = () => {
  const dispatch = useDispatch();

  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsDeepLinkUrl = useSelector(selectRewardsDeepLinkUrl);
  useCandidateSubscriptionId();

  useEffect(() => {
    if (rewardsEnabled && rewardsDeepLinkUrl) {
      dispatch(setRewardsModalOpen(true));
    }
  }, [dispatch, rewardsEnabled, rewardsDeepLinkUrl]);
};
