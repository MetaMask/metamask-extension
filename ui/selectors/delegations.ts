import { Json } from '@metamask/utils';

export type DelegationState = {
  metamask: {
    delegationData: {
      [account: string]: Json;
    };
  };
};

export function getDelegationData(state: DelegationState) {
  return state.metamask.delegationData;
}
