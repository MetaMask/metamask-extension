import { EarnControllerState } from '@metamask/earn-controller';
import { createSelector } from 'reselect';

export type EarnAppState = {
  metamask: EarnControllerState;
};

const getPooledStakingState = (state: EarnAppState) => {
  console.log('state: ', state);
  return state.metamask.pooled_staking;
};

export const getPooledStakingEligibility = createSelector(
  getPooledStakingState,
  (pooledStakingState) => pooledStakingState.isEligible,
);
