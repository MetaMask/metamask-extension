import { useMemo } from 'react';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { getIsShieldSubscriptionActive } from '../../../../../shared/lib/shield';

export const useEnableShieldCoverageChecks = () => {
  const { subscriptions } = useUserSubscriptions();

  const hasUserSubscribedToShield = useMemo(() => {
    return getIsShieldSubscriptionActive(subscriptions);
  }, [subscriptions]);

  return hasUserSubscribedToShield;
};
