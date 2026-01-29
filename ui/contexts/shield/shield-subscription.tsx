import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PRODUCT_TYPES,
  COHORT_NAMES,
  type Cohort,
  CohortName,
  ModalType,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { useSubscriptionEligibility } from '../../hooks/subscription/useSubscription';
import {
  assignUserToCohort,
  setShowShieldEntryModalOnce,
  subscriptionsStartPolling,
} from '../../store/actions';
import { getUseExternalServices } from '../../selectors';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../shared/modules/environment';
import {
  getHasShieldEntryModalShownOnce,
  getIsActiveShieldSubscription,
} from '../../selectors/subscription';
import { MetaMaskReduxDispatch } from '../../store/store';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { useSubscriptionMetrics } from '../../hooks/shield/metrics/useSubscriptionMetrics';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';

export const ShieldSubscriptionContext = React.createContext<{
  evaluateCohortEligibility: (entrypointCohort: string) => Promise<void>;
}>({
  evaluateCohortEligibility: async () => {
    // Default no-op implementation
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
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
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
  const { getSubscriptionEligibility: getShieldSubscriptionEligibility } =
    useSubscriptionEligibility(PRODUCT_TYPES.SHIELD);
  const { captureShieldEligibilityCohortEvent } = useSubscriptionMetrics();

  /**
   * Assigns a user to a cohort based on eligibility rate (80/20 split).
   * Returns the selected cohort or null.
   */
  const assignToCohort = useCallback(
    async (cohorts: Cohort[], modalType: ModalType): Promise<Cohort | null> => {
      if (cohorts.length === 0) {
        return null;
      }

      const sortedCohorts = [...cohorts].sort(
        (a, b) => a.priority - b.priority,
      );

      let selectedCohort: Cohort | null = null;

      if (sortedCohorts.length === 1) {
        selectedCohort = sortedCohorts[0];
      } else if (sortedCohorts.length >= 2) {
        const random = Math.random();
        let cumulativeRate = 0;

        for (const cohort of sortedCohorts) {
          cumulativeRate += cohort.eligibilityRate;
          if (random <= cumulativeRate) {
            selectedCohort = cohort;
            break;
          }
        }

        // Fallback: assign the last cohort if none selected
        if (!selectedCohort) {
          selectedCohort = sortedCohorts[sortedCohorts.length - 1];
        }
      }

      if (selectedCohort) {
        try {
          await dispatch(assignUserToCohort({ cohort: selectedCohort.cohort }));
          await captureShieldEligibilityCohortEvent(
            {
              cohort: selectedCohort.cohort as CohortName,
              modalType,
              numberOfEligibleCohorts: cohorts.length,
            },
            MetaMetricsEventName.ShieldEligibilityCohortAssigned,
          );
          return selectedCohort;
        } catch (error) {
          log.error('[ShieldSubscription] Failed to assign cohort', error);
          return null;
        }
      }

      return null;
    },
    [dispatch, captureShieldEligibilityCohortEvent],
  );

  /**
   * Ref to hold the latest implementation of evaluateCohortEligibility.
   * This allows the stable callback to access current values without recreating.
   */
  const evaluateCohortEligibilityRef =
    useRef<(entrypointCohort: string) => Promise<void>>();

  /**
   * Update the ref with the latest implementation whenever dependencies change.
   * This ensures the stable callback always has access to current values.
   */
  useEffect(() => {
    evaluateCohortEligibilityRef.current = async (
      entrypointCohort: string,
    ): Promise<void> => {
      try {
        if (!isMetaMaskShieldFeatureEnabled || !isBasicFunctionalityEnabled) {
          return;
        }

        if (isShieldSubscriptionActive) {
          dispatch(
            setShowShieldEntryModalOnce({
              show: false,
            }),
          );
          return;
        }

        if (!isSignedIn || !isUnlocked || hasShieldEntryModalShownOnce) {
          return;
        }

        const shieldEligibility = await getShieldSubscriptionEligibility();

        if (
          !shieldEligibility?.canSubscribe ||
          !shieldEligibility.canViewEntryModal
        ) {
          return;
        }

        const eligibleCohorts = shieldEligibility.cohorts.filter(
          (c: Cohort) => c.eligible,
        );
        const assignedCohortName = shieldEligibility.assignedCohort;
        const isUserPending = Boolean(assignedCohortName);
        const hasExpired = shieldEligibility.hasAssignedCohortExpired;
        const { modalType } = shieldEligibility;

        // User has an assigned cohort
        if (isUserPending) {
          // At wallet_home entrypoint: wait for expiry before showing cohort 2
          if (entrypointCohort !== COHORT_NAMES.POST_TX && !hasExpired) {
            return;
          }

          // User has an assigned cohort but it has expired
          // track `shield_eligibility_cohort_timeout` event
          await captureShieldEligibilityCohortEvent(
            {
              cohort: assignedCohortName as CohortName,
              numberOfEligibleCohorts: eligibleCohorts.length,
            },
            MetaMetricsEventName.ShieldEligibilityCohortTimeout,
          );

          const cohort = eligibleCohorts.find(
            (c) => c.cohort === entrypointCohort,
          );
          if (!cohort) {
            return;
          }

          dispatch(
            setShowShieldEntryModalOnce({
              show: true,
              shouldSubmitEvents: true, // submits `shield_entry_modal_viewed` event
              triggeringCohort: entrypointCohort,
              modalType,
              // we will show the modal but we won't update the background state yet,
              // we will only update after the user has interacted with the modal
              shouldUpdateBackgroundState: false,
            }),
          );
          return;
        }

        // New user - only assign from wallet_home entrypoint
        if (
          entrypointCohort === COHORT_NAMES.WALLET_HOME &&
          eligibleCohorts.length > 0 &&
          modalType
        ) {
          const selectedCohort = await assignToCohort(
            eligibleCohorts,
            modalType,
          );
          if (selectedCohort?.cohort === COHORT_NAMES.WALLET_HOME) {
            dispatch(
              setShowShieldEntryModalOnce({
                show: true,
                shouldSubmitEvents: true, // submits `shield_entry_modal_viewed` event to subscription backend
                triggeringCohort: selectedCohort.cohort,
                modalType,
                // we will show the modal but we won't update the background state yet,
                // we will only update after the user has interacted with the modal
                shouldUpdateBackgroundState: false,
              }),
            );
          }
        }
      } catch (error) {
        log.warn('[evaluateCohortEligibility] error', error);
      }
    };
  }, [
    dispatch,
    isMetaMaskShieldFeatureEnabled,
    isBasicFunctionalityEnabled,
    isShieldSubscriptionActive,
    isSignedIn,
    isUnlocked,
    hasShieldEntryModalShownOnce,
    getShieldSubscriptionEligibility,
    assignToCohort,
    captureShieldEligibilityCohortEvent,
  ]);

  /**
   * Evaluates cohort eligibility at a specific entrypoint.
   * Follows the flowchart logic for cohort assignment and modal display.
   *
   * Shield entry modal will be shown if:
   * - MetaMask Shield feature is enabled
   * - Basic functionality is enabled
   * - Subscription is not active
   * - User is signed in and unlocked
   * - User has not shown the shield entry modal before
   * - User's balance meets the minimum fiat balance threshold
   * - User meets cohort-specific eligibility criteria
   *
   * This callback remains stable across renders using the ref pattern,
   * preventing unnecessary re-renders of consuming components.
   */
  const evaluateCohortEligibility = useCallback(
    async (entrypointCohort: string): Promise<void> => {
      await evaluateCohortEligibilityRef.current?.(entrypointCohort);
    },
    [], // Empty deps = always stable!
  );

  useEffect(() => {
    if (
      isMetaMaskShieldFeatureEnabled &&
      isBasicFunctionalityEnabled &&
      isSignedIn &&
      isUnlocked
    ) {
      // start polling for the subscriptions
      dispatch(subscriptionsStartPolling());
    }
  }, [
    isMetaMaskShieldFeatureEnabled,
    isSignedIn,
    dispatch,
    isUnlocked,
    isBasicFunctionalityEnabled,
  ]);

  /**
   * Memoize the context value to prevent creating a new object reference
   * on every render, which would cause unnecessary re-renders of consuming components.
   */
  const contextValue = useMemo(
    () => ({ evaluateCohortEligibility }),
    [evaluateCohortEligibility],
  );

  return (
    <ShieldSubscriptionContext.Provider value={contextValue}>
      {children}
    </ShieldSubscriptionContext.Provider>
  );
};
