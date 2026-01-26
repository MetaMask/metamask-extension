import { useCallback, useEffect, useRef } from 'react';
import log from 'loglevel';
import { useSelector, useDispatch } from 'react-redux';
import { getRewardsCandidateSubscriptionId } from '../../store/actions';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  selectCandidateSubscriptionId,
  selectRewardsEnabled,
} from '../../ducks/rewards/selectors';
import { setCandidateSubscriptionId } from '../../ducks/rewards';
import { useAppSelector } from '../../store/store';
import { usePrimaryWalletGroupAccounts } from './usePrimaryWalletGroupAccounts';

type UseCandidateSubscriptionIdReturn = {
  fetchCandidateSubscriptionId: () => Promise<void>;
};

/**
 * Hook to fetch and manage candidate subscription ID
 */
export const useCandidateSubscriptionId =
  (): UseCandidateSubscriptionIdReturn => {
    const dispatch = useDispatch();

    const isUnlocked = useSelector(getIsUnlocked);
    const isRewardsEnabled = useSelector(selectRewardsEnabled);
    const candidateSubscriptionId = useSelector(selectCandidateSubscriptionId);
    const rewardsActiveAccountSubscriptionId = useAppSelector(
      (state) => state.metamask.rewardsActiveAccount?.subscriptionId,
    );

    // Get accounts for the primary account group
    const { accounts: primaryWalletGroupAccounts } = usePrimaryWalletGroupAccounts();

    const isLoading = useRef(false);

    const fetchCandidateSubscriptionId = useCallback(async () => {
      try {
        if (!isRewardsEnabled) {
          dispatch(setCandidateSubscriptionId(null));
          return;
        }
        if (rewardsActiveAccountSubscriptionId) {
          isLoading.current = false;
          dispatch(
            setCandidateSubscriptionId(rewardsActiveAccountSubscriptionId),
          );
          return;
        }
        if (isLoading.current) {
          return;
        }
        isLoading.current = true;

        const candidateId = (await dispatch(
          getRewardsCandidateSubscriptionId(
            primaryWalletGroupAccounts,
          ),
        )) as unknown as string | null;
        dispatch(setCandidateSubscriptionId(candidateId));
      } catch (error) {
        log.error(
          '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
          error,
        );
        // Check if it's the specific error for hardware wallet needing authentication
        if (
          error instanceof Error &&
          error.message ===
          'Primary wallet account group has opted in but is not authenticated yet'
        ) {
          dispatch(setCandidateSubscriptionId('error-existing-subscription-hardware-wallet-explicit-sign'));
        } else {
          dispatch(setCandidateSubscriptionId('error'));
        }
      } finally {
        isLoading.current = false;
      }
    }, [
      isRewardsEnabled,
      dispatch,
      rewardsActiveAccountSubscriptionId,
      primaryWalletGroupAccounts,
    ]);

    useEffect(() => {
      if (candidateSubscriptionId === 'retry') {
        fetchCandidateSubscriptionId();
      }
    }, [candidateSubscriptionId, fetchCandidateSubscriptionId]);

    useEffect(() => {
      if (isUnlocked) {
        fetchCandidateSubscriptionId();
      }
    }, [fetchCandidateSubscriptionId, isUnlocked]);

    return {
      fetchCandidateSubscriptionId,
    };
  };
