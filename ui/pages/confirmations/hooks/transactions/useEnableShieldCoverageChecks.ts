import { useMemo } from 'react';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { getIsShieldSubscriptionActive } from '../../../../../shared/lib/shield';

export const useEnableShieldCoverageChecks = () => {
  // NOTE: no need to wait for subscriptions loading here since user subscriptions is already loaded in the background
  const { subscriptions } = useUserSubscriptions({
    refetch: false,
  });

  const hasUserSubscribedToShield = useMemo(() => {
    return getIsShieldSubscriptionActive(subscriptions);
  }, [subscriptions]);

  return hasUserSubscribedToShield;
};
