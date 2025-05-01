import {
  DelegationEntry,
  DelegationFilter,
} from '@metamask/delegation-controller';
import { createSelector } from 'reselect';
import { listDelegationEntries } from '../../shared/lib/delegation/delegation';
import { Hex } from '../../shared/lib/delegation/utils';
import {
  REMOTE_MODES,
  RemoteModeConfig,
} from '../pages/remote-mode/remote.types';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from './remote-feature-flags';

const EIP7702_CONTRACT_ADDRESSES_FLAG = 'confirmations_eip_7702';

type DelegationState = {
  metamask: {
    delegations: {
      [hash: Hex]: DelegationEntry;
    };
  };
};

/**
 * Get the state of the `vaultRemoteMode` remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns The state of the `vaultRemoteMode` remote feature flag
 */
export function getIsRemoteModeEnabled(state: RemoteFeatureFlagsState) {
  const { vaultRemoteMode } = getRemoteFeatureFlags(state);
  return vaultRemoteMode;
}

export function getEIP7702ContractAddresses(state: RemoteFeatureFlagsState) {
  const flags = getRemoteFeatureFlags(state);
  return flags[EIP7702_CONTRACT_ADDRESSES_FLAG];
}

const getRemoteModeDelegationEntries = (
  state: DelegationState,
  requester: Hex,
  filter: DelegationFilter,
) => {
  const { delegations } = state.metamask;
  const swapDelegationEntry = listDelegationEntries({
    filter: {
      ...filter,
      tags: [REMOTE_MODES.SWAP],
    },
    delegations,
    requester,
  });
  const dailyDelegationEntry = listDelegationEntries({
    filter: {
      ...filter,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
    },
    delegations,
    requester,
  });
  return { swapDelegationEntry, dailyDelegationEntry };
};

export const getRemoteModeConfig = createSelector(
  (state, requester: Hex, filter: DelegationFilter) =>
    getRemoteModeDelegationEntries(state, requester, filter),
  ({ swapDelegationEntry, dailyDelegationEntry }) => {
    const config: RemoteModeConfig = {
      swapAllowance: null,
      dailyAllowance: null,
    };

    if (swapDelegationEntry.length) {
      const metaObject = swapDelegationEntry[0].meta
        ? JSON.parse(swapDelegationEntry[0].meta)
        : { allowances: [] };

      const revokeId = metaObject.revokeId ?? undefined;
      const allowances = metaObject.allowances ?? [];
      config.swapAllowance = {
        revokeId,
        allowances,
        delegation: swapDelegationEntry[0].delegation,
      };
    }

    if (dailyDelegationEntry.length) {
      const metaObject = dailyDelegationEntry[0].meta
        ? JSON.parse(dailyDelegationEntry[0].meta)
        : { allowances: [] };

      const revokeId = metaObject.revokeId ?? undefined;
      const allowances = metaObject.allowances ?? [];
      config.dailyAllowance = {
        revokeId,
        allowances,
        delegation: dailyDelegationEntry[0].delegation,
      };
    }
    return config;
  },
);
