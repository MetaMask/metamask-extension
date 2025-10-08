import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Subscription } from '@metamask/subscription-controller';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import { setShowShieldEntryModalOnce } from '../../store/actions';
import {
  getSelectedInternalAccount,
  getUseExternalServices,
} from '../../selectors';
import { useAccountTotalFiatBalance } from '../../hooks/useAccountTotalFiatBalance';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../shared/modules/environment';
import {
  getHasShieldEntryModalShownOnce,
  getIsActiveShieldSubscription,
} from '../../selectors/subscription';
import { SHIELD_MIN_FIAT_BALANCE_THRESHOLD } from '../../../shared/constants/subscriptions';

export const ShieldSubscriptionContext = React.createContext<
  Subscription | undefined
>(undefined);

export const ShieldSubscriptionProvider: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const isMetaMaskShieldFeatureEnabled = getIsMetaMaskShieldFeatureEnabled();
  const isSignedIn = useSelector(selectIsSignedIn);
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    'shield',
    subscriptions,
  );
  const isShieldSubscriptionActive = useSelector(getIsActiveShieldSubscription);
  const hasShieldEntryModalShownOnce = useSelector(
    getHasShieldEntryModalShownOnce,
  );
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    false,
    'usd',
  );

  /**
   * Check if the user's balance criteria is met to show the shield entry modal.
   * Shield entry modal will be shown if:
   * - Subscription is not active
   * - User is signed in
   * - User has a balance greater than the minimum fiat balance threshold (1K USD)
   * - User has not shown the shield entry modal before
   */
  const getIsUserBalanceCriteriaMet = useCallback(() => {
    if (
      !isShieldSubscriptionActive &&
      selectedAccount &&
      isSignedIn &&
      totalFiatBalance &&
      Number(totalFiatBalance) >= SHIELD_MIN_FIAT_BALANCE_THRESHOLD
    ) {
      return true;
    }

    return false;
  }, [
    isShieldSubscriptionActive,
    selectedAccount,
    isSignedIn,
    totalFiatBalance,
  ]);

  useEffect(() => {
    if (!isMetaMaskShieldFeatureEnabled || !isBasicFunctionalityEnabled) {
      return;
    }

    if (isShieldSubscriptionActive) {
      // reset the shield entry modal state if subscription is active
      dispatch(setShowShieldEntryModalOnce(null));
    } else if (!hasShieldEntryModalShownOnce) {
      // shield entry modal has been shown before,
      const isUserBalanceCriteriaMet = getIsUserBalanceCriteriaMet();
      if (isUserBalanceCriteriaMet) {
        dispatch(setShowShieldEntryModalOnce(true));
      }
    }
  }, [
    dispatch,
    isMetaMaskShieldFeatureEnabled,
    isShieldSubscriptionActive,
    getIsUserBalanceCriteriaMet,
    hasShieldEntryModalShownOnce,
    isBasicFunctionalityEnabled,
  ]);

  return (
    <ShieldSubscriptionContext.Provider value={shieldSubscription}>
      {children}
    </ShieldSubscriptionContext.Provider>
  );
};
