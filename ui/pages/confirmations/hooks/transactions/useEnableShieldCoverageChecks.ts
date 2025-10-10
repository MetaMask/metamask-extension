import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { getIsShieldSubscriptionActive } from '../../../../../shared/lib/shield';

export const useEnableShieldCoverageChecks = () => {
  const {
    subscriptions,
    loading: subscriptionsLoading,
    error: subscriptionsError,
  } = useUserSubscriptions();

  const hasUserSubscribedToShield =
    !subscriptionsLoading &&
    !subscriptionsError &&
    getIsShieldSubscriptionActive(subscriptions);

  return hasUserSubscribedToShield;
};
