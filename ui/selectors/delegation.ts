import type { Hex } from '@metamask/utils';
import type { DelegationEntry } from '@metamask/delegation-controller';
import { isHexEqual } from '../../shared/lib/delegation/utils';

type Address = Hex;

export type DelegationState = {
  metamask: {
    delegations: {
      [hash: Hex]: DelegationEntry;
    };
  };
};

// TODO: eventually we should remove the DelegationFilter type from
// the DelegationController and move the get/list logic into ui selectors
export type DelegationFilter = {
  from?: Address;
  to?: Address;
  chainId?: Hex;
  tags?: string[];
};

export type ListDelegationEntriesOptions = {
  filter?: DelegationFilter;
};

/**
 * Lists delegation entries.
 *
 * @param state - The state object.
 * @param options - The options to use to list the delegation entries.
 * @param options.filter - The filter to use to list the delegation entries.
 * @returns A list of delegation entries that match the filter.
 */
export const listDelegationEntries = (
  state: DelegationState,
  { filter }: ListDelegationEntriesOptions,
) => {
  let list = Object.values(state.metamask.delegations);

  const { from, to, chainId, tags } = filter ?? {};

  if (from) {
    list = list.filter((entry) => isHexEqual(entry.delegation.delegator, from));
  }

  if (to) {
    list = list.filter((entry) => isHexEqual(entry.delegation.delegate, to));
  }

  if (chainId) {
    list = list.filter((entry) => isHexEqual(entry.chainId, chainId));
  }

  if (tags && tags.length > 0) {
    // Filter entries that contain all of the filter tags
    list = list.filter((entry) =>
      tags.every((tag) => entry.tags.includes(tag)),
    );
  }

  return list;
};

/**
 * Gets a delegation entry by hash.
 *
 * @param state - The state object.
 * @param hash - The hash of the delegation entry.
 * @returns The delegation entry.
 */
export const getDelegationEntry = (state: DelegationState, hash: Hex) => {
  return state.metamask.delegations[hash];
};
