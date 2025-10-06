import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import { getShowShieldEntryModalOnce } from '../../selectors/selectors';
import { setShowShieldEntryModalOnce } from '../../store/actions';
import {
  getSelectedInternalAccount,
  getUseExternalServices,
} from '../../selectors';
import { useAccountTotalFiatBalance } from '../../hooks/useAccountTotalFiatBalance';
import { SHIELD_MIN_FIAT_BALANCE_THRESHOLD } from '../../../shared/constants/app';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../shared/modules/environment';

export const ShieldSubscriptionContext = React.createContext<
  Subscription | undefined
>(undefined);

export const ShieldSubscriptionProvider: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const isSignedIn = useSelector(selectIsSignedIn);
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    'shield',
    subscriptions,
  );
  const shieldEntryModalShownOnce = useSelector(getShowShieldEntryModalOnce);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    false,
  );
  const isMetaMaskShieldFeatureEnabled = getIsMetaMaskShieldFeatureEnabled();

  /**
   * Watch the shield subscription and show the shield entry modal if the subscription is paused and modal is not shown once
   */
  const watchShieldSubscription = useCallback(() => {
    if (!shieldSubscription) {
      return;
    }
    const { status } = shieldSubscription;
    if (!shieldEntryModalShownOnce && status === SUBSCRIPTION_STATUSES.paused) {
      // show shield entry modal if subscription is paused and modal is not shown once
      dispatch(setShowShieldEntryModalOnce(true));
    } else if (
      shieldEntryModalShownOnce &&
      status === SUBSCRIPTION_STATUSES.active
    ) {
      // hide shield entry modal if subscription is active and modal is shown once
      dispatch(setShowShieldEntryModalOnce(null));
    }
  }, [shieldSubscription, shieldEntryModalShownOnce, dispatch]);

  /**
   * Watch the balance and show the shield entry modal if the balance is greater than the minimum fiat balance threshold
   */
  const watchBalance = useCallback(() => {
    console.log('isMetaMaskShieldFeatureEnabled', isMetaMaskShieldFeatureEnabled);
    console.log('shieldEntryModalShownOnce', shieldEntryModalShownOnce);
    if (
      shieldEntryModalShownOnce !== null ||
      !selectedAccount ||
      shieldSubscription
    ) {
      return;
    }

    if (
      isBasicFunctionalityEnabled &&
      isSignedIn &&
      totalFiatBalance &&
      Number(totalFiatBalance) >= SHIELD_MIN_FIAT_BALANCE_THRESHOLD
    ) {
      dispatch(setShowShieldEntryModalOnce(true));
    }
  }, [
    shieldEntryModalShownOnce,
    dispatch,
    selectedAccount,
    totalFiatBalance,
    isSignedIn,
    isBasicFunctionalityEnabled,
    shieldSubscription,
  ]);

  useEffect(() => {
    if (!isMetaMaskShieldFeatureEnabled) {
      return;
    }

    watchShieldSubscription();
    watchBalance();
  }, [watchShieldSubscription, watchBalance]);

  return (
    <ShieldSubscriptionContext.Provider value={shieldSubscription}>
      {children}
    </ShieldSubscriptionContext.Provider>
  );
};
