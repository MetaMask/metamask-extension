import React, { useContext } from 'react';
import type { SeasonStatusState } from '../../../shared/types/rewards';
import { useCandidateSubscriptionId } from '../../hooks/rewards/useCandidateSubscriptionId';
import { useSeasonStatus } from '../../hooks/rewards/useSeasonStatus';
import { useRewardsEnabled } from '../../hooks/rewards/useRewardsEnabled';

export type RewardsContextValue = {
  rewardsEnabled: boolean;
  candidateSubscriptionId: string | null;
  candidateSubscriptionIdError: boolean;
  seasonStatus: SeasonStatusState | null;
  seasonStatusError: string | null;
  seasonStatusLoading: boolean;
  refetchSeasonStatus: () => Promise<void>;
};

export const RewardsContext = React.createContext<RewardsContextValue>({
  rewardsEnabled: false,
  candidateSubscriptionId: null,
  candidateSubscriptionIdError: false,
  seasonStatus: null,
  seasonStatusError: null,
  seasonStatusLoading: false,
  refetchSeasonStatus: async () => {
    // Default empty function
  },
});

export const useRewardsContext = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewardsContext must be used within a RewardsProvider');
  }
  return context;
};

export const RewardsProvider: React.FC = ({ children }) => {
  const rewardsEnabled = useRewardsEnabled();
  const {
    candidateSubscriptionId,
    candidateSubscriptionIdError,
    fetchCandidateSubscriptionId,
  } = useCandidateSubscriptionId();

  const {
    seasonStatus,
    seasonStatusError,
    seasonStatusLoading,
    fetchSeasonStatus,
  } = useSeasonStatus({
    subscriptionId: candidateSubscriptionId,
    onAuthorizationError: fetchCandidateSubscriptionId,
  });

  return (
    <RewardsContext.Provider
      value={{
        rewardsEnabled,
        candidateSubscriptionId,
        candidateSubscriptionIdError,
        seasonStatus,
        seasonStatusError,
        seasonStatusLoading,
        refetchSeasonStatus: fetchSeasonStatus,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};
