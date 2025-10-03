import React, { useCallback, useEffect, useRef } from 'react';
import { useUserSubscriptionByProduct, useUserSubscriptions } from '../../hooks/subscription/useSubscription';
import { Subscription } from '@metamask/subscription-controller';
import { useSelector, useDispatch } from 'react-redux';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { getSubscriptions } from '../../store/actions';
import { getUserSubscriptions } from '../../selectors/subscription';

export const ShieldSubscriptionContext = React.createContext<Subscription | undefined>(undefined);

export const SHIELD_SUBSCRIPTION_REFRESH_INTERVAL = 1000 * 60 * 60; // 1 hour

export const ShieldSubscriptionProvider: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const { subscriptions, loading } = useUserSubscriptions();
  const activeShieldSubscription = useUserSubscriptionByProduct('shield', subscriptions);
  const isUnlocked = Boolean(useSelector(getIsUnlocked));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      console.log('[ShieldSubscriptionProvider] cleared interval', intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    if (intervalRef.current !== null) {
      intervalRef.current = setInterval(async () => {
        console.log('[ShieldSubscriptionProvider] refreshing shield subscription', intervalRef.current);
        const updatedSubscriptions = await dispatch(getSubscriptions());
        console.log('[ShieldSubscriptionProvider] updated subscriptions', updatedSubscriptions);
      }, 10_000);

      console.log('[ShieldSubscriptionProvider] started interval', intervalRef.current);
    }
  }, [dispatch])

  useEffect(() => {
    console.log('activeShieldSubscription', activeShieldSubscription);
    console.log('loading', loading);

    if (loading || !activeShieldSubscription || !isUnlocked) {
      // cancel any existing timers
      cancelPolling();
      return;
    };

    refreshSubscriptions();


    return () => cancelPolling();
  }, [activeShieldSubscription, loading, isUnlocked, cancelPolling, refreshSubscriptions])

  return <ShieldSubscriptionContext.Provider value={activeShieldSubscription}>{children}</ShieldSubscriptionContext.Provider>;
};
