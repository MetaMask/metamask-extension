import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
} from '../../../../../shared/lib/shield';
import { getUseExternalServices } from '../../../../selectors';

export const useEnableShieldCoverageChecks = () => {
  const { subscriptions } = useUserSubscriptions();
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);

  const isShieldSubscriptionActive = useMemo(() => {
    return getIsShieldSubscriptionActive(subscriptions);
  }, [subscriptions]);

  const isShieldSubscriptionPaused = useMemo(() => {
    return getIsShieldSubscriptionPaused(subscriptions);
  }, [subscriptions]);

  return {
    isEnabled: isBasicFunctionalityEnabled && isShieldSubscriptionActive,
    isPaused: isShieldSubscriptionPaused,
  };
};
