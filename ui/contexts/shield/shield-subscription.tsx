import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import log from 'loglevel';
import { useSubscriptionEligibility } from '../../hooks/subscription/useSubscription';
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
import { getIsUnlocked } from '../../ducks/metamask/metamask';

export const ShieldSubscriptionContext = React.createContext<{
  resetShieldEntryModalShownStatus: () => void;
  setShieldEntryModalShownStatus: (
    showShieldEntryModalOnce: boolean | null,
  ) => void;
}>({
  resetShieldEntryModalShownStatus: () => {
    // Default empty function
  },
  setShieldEntryModalShownStatus: () => {
    // Default empty function
  },
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
  const isUnlocked = useSelector(getIsUnlocked);
  const isSignedIn = useSelector(selectIsSignedIn);
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
  const evaluateShieldEntryPointModal = useCallback(async () => {
    try {
      if (isShieldSubscriptionActive) {
        dispatch(setShowShieldEntryModalOnce(false));
        return;
      } else if (
        !selectedAccount ||
        !isSignedIn ||
        !isUnlocked ||
        hasShieldEntryModalShownOnce
      ) {
        return;
      }

      const shieldSubscriptionEligibility =
        await getShieldSubscriptionEligibility();
      if (
        shieldSubscriptionEligibility?.canSubscribe &&
        shieldSubscriptionEligibility?.canViewEntryModal &&
        shieldSubscriptionEligibility?.minBalanceUSD &&
        totalFiatBalance &&
        Number(totalFiatBalance) >= shieldSubscriptionEligibility?.minBalanceUSD
      ) {
        const shouldSubmitUserEvents = true; // submits `shield_entry_modal_viewed` event
        dispatch(setShowShieldEntryModalOnce(true, shouldSubmitUserEvents));
      }
    } catch (error) {
      log.warn('[getIsUserBalanceCriteriaMet] error', error);
    }
  }, [
    isShieldSubscriptionActive,
    getShieldSubscriptionEligibility,
    selectedAccount,
    isSignedIn,
    isUnlocked,
    totalFiatBalance,
    hasShieldEntryModalShownOnce,
    dispatch,
  ]);

  useEffect(() => {
    if (!isMetaMaskShieldFeatureEnabled || !isBasicFunctionalityEnabled) {
      return;
    }

    evaluateShieldEntryPointModal();
  }, [
    dispatch,
    isMetaMaskShieldFeatureEnabled,
    evaluateShieldEntryPointModal,
    isBasicFunctionalityEnabled,
  ]);

  useEffect(() => {
    if (selectedAccount && isSignedIn && isUnlocked) {
      // start polling for the subscriptions
      dispatch(subscriptionsStartPolling());
    }
  }, [isSignedIn, selectedAccount, dispatch, isUnlocked]);

  const resetShieldEntryModalShownStatus = useCallback(() => {
    if (!isShieldSubscriptionActive) {
      dispatch(setShowShieldEntryModalOnce(null));
    }
  }, [isShieldSubscriptionActive, dispatch]);

  const setShieldEntryModalShownStatus = useCallback(
    (showShieldEntryModalOnce: boolean | null) => {
      if (!isShieldSubscriptionActive) {
        const shouldSubmitUserEvents = Boolean(showShieldEntryModalOnce); // submits `shield_entry_modal_viewed` event
        dispatch(
          setShowShieldEntryModalOnce(
            showShieldEntryModalOnce,
            shouldSubmitUserEvents,
          ),
        );
      }
    },
    [dispatch, isShieldSubscriptionActive],
  );

  return (
    <ShieldSubscriptionContext.Provider
      value={{
        resetShieldEntryModalShownStatus,
        setShieldEntryModalShownStatus,
      }}
    >
      {children}
    </ShieldSubscriptionContext.Provider>
  );
};
