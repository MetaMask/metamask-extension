import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { getCompletedOnboarding } from '../../ducks/metamask/metamask';
import { fetchBuyableChains } from '../../ducks/ramps';

/**
 * Fetches buyable networks from the ramp API when the wallet is ready.
 * The thunk caches results in Redux, so this only triggers one network request
 * per session regardless of how many components mount the hook.
 */
export function useFetchBuyableChains(): void {
  const dispatch = useDispatch();
  const isUnlocked = useSelector(getIsUnlocked);
  const completedOnboarding = useSelector(getCompletedOnboarding);

  useEffect(() => {
    if (!isUnlocked || !completedOnboarding) {
      return;
    }

    dispatch(fetchBuyableChains());
  }, [dispatch, isUnlocked, completedOnboarding]);
}
