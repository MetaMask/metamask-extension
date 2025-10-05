import React, { useEffect } from 'react';
import { useUserSubscriptionByProduct, useUserSubscriptions } from '../../hooks/subscription/useSubscription';
import { Subscription, SUBSCRIPTION_STATUSES } from '@metamask/subscription-controller';
import { useDispatch, useSelector } from 'react-redux';
import { setShowShieldEntryModalOnce } from '../../store/actions';
import { getShowShieldEntryModalOnce } from '../../selectors/selectors';

export const ShieldSubscriptionContext = React.createContext<Subscription | undefined>(undefined);

export const SHIELD_SUBSCRIPTION_REFRESH_INTERVAL = 1000 * 60 * 60; // 1 hour

export const ShieldSubscriptionProvider: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct('shield', subscriptions);
  const shieldEntryModalShownOnce = useSelector(getShowShieldEntryModalOnce);

  useEffect(() => {
    if (!shieldSubscription) {
      return;
    }

    const { status } = shieldSubscription;
    if (!shieldEntryModalShownOnce && status === SUBSCRIPTION_STATUSES.paused) {
      // show shield entry modal if subscription is paused and modal is not shown once
      dispatch(setShowShieldEntryModalOnce(true));
    } else if (shieldEntryModalShownOnce && status === SUBSCRIPTION_STATUSES.active) {
      // hide shield entry modal if subscription is active and modal is shown once
      dispatch(setShowShieldEntryModalOnce(false));
    }
  }, [shieldSubscription, shieldEntryModalShownOnce, dispatch])

  return <ShieldSubscriptionContext.Provider value={shieldSubscription}>{children}</ShieldSubscriptionContext.Provider>;
};
