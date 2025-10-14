import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PRODUCT_TYPES, Subscription } from '@metamask/subscription-controller';
import {
  useSubscriptionEligibility,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import {
  setShowShieldEntryModalOnce,
  subscriptionsStartPolling,
} from '../../store/actions';
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

export const ShieldSubscriptionContext = React.createContext<{
  resetShieldEntryModalShownStatus: () => void;
  setShieldEntryModalShownStatus: (
    showShieldEntryModalOnce: boolean | null,
  ) => void;
  shieldSubscription: Subscription | undefined;
}>({
  resetShieldEntryModalShownStatus: () => {
    // Default empty function
  },
  setShieldEntryModalShownStatus: () => {
    // Default empty function
  },
  shieldSubscription: undefined,
});

export const useShieldSubscriptionContext = () => {
  const context = useContext(ShieldSubscriptionContext);
  if (!context) {
    throw new Error(
      'useShieldSubscriptionContext must be used within a ShieldSubscriptionProvider',
    );
  }
  return context;
};

export const ShieldSubscriptionProvider: React.FC = ({ children }) => {
  const dispatch = useDispatch();
  const isBasicFunctionalityEnabled = Boolean(
    useSelector(getUseExternalServices),
  );
  const isMetaMaskShieldFeatureEnabled = getIsMetaMaskShieldFeatureEnabled();
  const isSignedIn = useSelector(selectIsSignedIn);
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const isShieldSubscriptionActive = useSelector(getIsActiveShieldSubscription);
  const hasShieldEntryModalShownOnce = useSelector(
    getHasShieldEntryModalShownOnce,
  );
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { getSubscriptionEligibility: getShieldSubscriptionEligibility } =
    useSubscriptionEligibility(PRODUCT_TYPES.SHIELD);
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    false,
    true, // use USD conversion rate instead of the current currency
  );

  /**
   * Check if the user's balance criteria is met to show the shield entry modal.
   * Shield entry modal will be shown if:
   * - Subscription is not active
   * - User is signed in
   * - User has a balance greater than the minimum fiat balance threshold (1K USD)
   * - User has not shown the shield entry modal before
   */
  const getIsUserBalanceCriteriaMet = useCallback(async () => {
    if (isShieldSubscriptionActive || !selectedAccount || !isSignedIn) {
      return false;
    }

    const shieldSubscriptionEligibility =
      await getShieldSubscriptionEligibility();
    if (
      shieldSubscriptionEligibility?.canSubscribe &&
      shieldSubscriptionEligibility?.canViewEntryModal &&
      shieldSubscriptionEligibility?.minBalanceUSD &&
      totalFiatBalance &&
      Number(totalFiatBalance) >= shieldSubscriptionEligibility.minBalanceUSD
    ) {
      return true;
    }

    return false;
  }, [
    isShieldSubscriptionActive,
    getShieldSubscriptionEligibility,
    selectedAccount,
    isSignedIn,
    totalFiatBalance,
  ]);

  useEffect(() => {
    (async () => {
      if (!isMetaMaskShieldFeatureEnabled || !isBasicFunctionalityEnabled) {
        return;
      }

      if (isShieldSubscriptionActive) {
        // if user has subscribed to shield, set the shield entry modal shown status to false
        // means we will not show the shield entry modal again
        dispatch(setShowShieldEntryModalOnce(false));
      } else if (!hasShieldEntryModalShownOnce) {
        // shield entry modal has been shown before,
        const isUserBalanceCriteriaMet = await getIsUserBalanceCriteriaMet();
        if (isUserBalanceCriteriaMet) {
          dispatch(setShowShieldEntryModalOnce(true));
        }
      }
    })();
  }, [
    dispatch,
    isMetaMaskShieldFeatureEnabled,
    isShieldSubscriptionActive,
    getIsUserBalanceCriteriaMet,
    hasShieldEntryModalShownOnce,
    isBasicFunctionalityEnabled,
  ]);

  useEffect(() => {
    if (selectedAccount && isSignedIn) {
      // start polling for the subscriptions
      dispatch(subscriptionsStartPolling());
    }
  }, [isSignedIn, selectedAccount, dispatch]);

  const resetShieldEntryModalShownStatus = useCallback(() => {
    if (!isShieldSubscriptionActive) {
      dispatch(setShowShieldEntryModalOnce(null));
    }
  }, [isShieldSubscriptionActive, dispatch]);

  const setShieldEntryModalShownStatus = useCallback(
    (showShieldEntryModalOnce: boolean | null) => {
      if (!isShieldSubscriptionActive) {
        dispatch(setShowShieldEntryModalOnce(showShieldEntryModalOnce));
      }
    },
    [dispatch, isShieldSubscriptionActive],
  );

  return (
    <ShieldSubscriptionContext.Provider
      value={{
        resetShieldEntryModalShownStatus,
        setShieldEntryModalShownStatus,
        shieldSubscription,
      }}
    >
      {children}
    </ShieldSubscriptionContext.Provider>
  );
};
