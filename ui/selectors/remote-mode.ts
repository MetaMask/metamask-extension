import { DelegationEntry } from '@metamask/delegation-controller';
import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import {
  REMOTE_MODES,
  RemoteModeConfig,
} from '../pages/remote-mode/remote.types';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from './remote-feature-flags';
import { type DelegationState, listDelegationEntries } from './delegation';

const EIP7702_CONTRACT_ADDRESSES_FLAG = 'confirmations_eip_7702';

type Address = Hex;

/**
 * Get the state of the `vaultRemoteMode` remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns The state of the `vaultRemoteMode` remote feature flag
 */
export function getIsRemoteModeEnabled(state: RemoteFeatureFlagsState) {
  const { vaultRemoteMode } = getRemoteFeatureFlags(state);
  return Boolean(vaultRemoteMode);
}

export function getEIP7702ContractAddresses(state: RemoteFeatureFlagsState) {
  const flags = getRemoteFeatureFlags(state);
  return flags[EIP7702_CONTRACT_ADDRESSES_FLAG];
}

const getRemoteModeDelegationEntries = (
  state: DelegationState,
  requester: Address,
  chainId: Hex,
) => {
  const swapEntries = listDelegationEntries(state, {
    filter: {
      to: requester,
      tags: [REMOTE_MODES.SWAP],
      chainId,
    },
  });
  const dailyEntries = listDelegationEntries(state, {
    filter: {
      to: requester,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
      chainId,
    },
  });
  return {
    swapDelegationEntry: swapEntries[0],
    dailyDelegationEntry: dailyEntries[0],
  };
};

export const getRemoteModeConfig = createSelector(
  (state, requester: Address, chainId: Hex) =>
    getRemoteModeDelegationEntries(state, requester, chainId),
  ({
    swapDelegationEntry,
    dailyDelegationEntry,
  }: {
    swapDelegationEntry?: DelegationEntry;
    dailyDelegationEntry?: DelegationEntry;
  }) => {
    const config: RemoteModeConfig = {
      swapAllowance: null,
      dailyAllowance: null,
    };

    if (swapDelegationEntry) {
      const metaObject = swapDelegationEntry.meta
        ? JSON.parse(swapDelegationEntry.meta)
        : { allowances: [] };

      const revokeId = metaObject.revokeId ?? undefined;
      const allowances = metaObject.allowances ?? [];
      config.swapAllowance = {
        revokeId,
        allowances,
        delegation: swapDelegationEntry.delegation,
      };
    }

    if (dailyDelegationEntry) {
      const metaObject = dailyDelegationEntry.meta
        ? JSON.parse(dailyDelegationEntry.meta)
        : { allowances: [] };

      const revokeId = metaObject.revokeId ?? undefined;
      const allowances = metaObject.allowances ?? [];
      config.dailyAllowance = {
        revokeId,
        allowances,
        delegation: dailyDelegationEntry.delegation,
      };
    }
    return config;
  },
);
