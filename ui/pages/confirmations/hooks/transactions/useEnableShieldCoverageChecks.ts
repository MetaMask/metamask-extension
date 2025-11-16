import { useMemo } from 'react';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
} from '../../../../../shared/lib/shield';

export const useEnableShieldCoverageChecks = () => {
  const { subscriptions } = useUserSubscriptions();

  const isShieldSubscriptionActive = useMemo(() => {
    return getIsShieldSubscriptionActive(subscriptions);
  }, [subscriptions]);

  const isShieldSubscriptionPaused = useMemo(() => {
    return getIsShieldSubscriptionPaused(subscriptions);
  }, [subscriptions]);

  return {
    isEnabled: isShieldSubscriptionActive,
    isPaused: isShieldSubscriptionPaused,
  };
};
