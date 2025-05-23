import { DelegationEntry } from '@metamask/delegation-controller';
import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import {
  DailyAllowance,
  REMOTE_MODES,
  RemoteModeConfig,
} from '../pages/remote-mode/remote.types';
import { Asset } from '../ducks/send';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from './remote-feature-flags';
import { type DelegationState, listDelegationEntries } from './delegation';

const EIP7702_CONTRACT_ADDRESSES_FLAG = 'confirmations_eip_7702';

type Address = Hex;

export type RemoteModeState = RemoteFeatureFlagsState & DelegationState;

/**
 * Get the state of the `vaultRemoteMode` remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns The state of the `vaultRemoteMode` remote feature flag
 */
export function getIsRemoteModeEnabled(state: RemoteModeState) {
  const { vaultRemoteMode } = getRemoteFeatureFlags(state);
  return Boolean(vaultRemoteMode);
}

/**
 * Get the EIP-7702 contract addresses from the remote feature flags.
 *
 * @param state - The MetaMask state object
 * @returns The EIP-7702 contract addresses
 */
export function getEIP7702ContractAddresses(state: RemoteModeState) {
  const flags = getRemoteFeatureFlags(state);
  return flags[EIP7702_CONTRACT_ADDRESSES_FLAG];
}

/**
 * Get the remote mode delegation entries.
 *
 * @param state - The MetaMask state object
 * @param account - The account address
 * @param chainId - The chain ID
 */
export const getRemoteModeDelegationEntries = (
  state: RemoteModeState,
  account: Address,
  chainId: Hex,
) => {
  const isRemoteModeEnabled = getIsRemoteModeEnabled(state);

  if (!isRemoteModeEnabled) {
    return {
      swapDelegationEntry: null,
      dailyDelegationEntry: null,
    };
  }
  const swapEntries = listDelegationEntries(state, {
    filter: {
      from: account,
      tags: [REMOTE_MODES.SWAP],
      chainId,
    },
  });
  const dailyEntries = listDelegationEntries(state, {
    filter: {
      from: account,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
      chainId,
    },
  });
  return {
    swapDelegationEntry: swapEntries[0],
    dailyDelegationEntry: dailyEntries[0],
  };
};

/**
 * Get the remote mode config.
 *
 * @param state - The MetaMask state object
 * @param hwAccount - The hardware account address
 * @param chainId - The chain ID
 */
export const getRemoteModeConfig = createSelector(
  (state, hwAccount: Address, chainId: Hex) =>
    getRemoteModeDelegationEntries(state, hwAccount, chainId),
  ({
    swapDelegationEntry,
    dailyDelegationEntry,
  }: {
    swapDelegationEntry?: DelegationEntry | null;
    dailyDelegationEntry?: DelegationEntry | null;
  }) => {
    const config: RemoteModeConfig = {
      swapAllowance: null,
      dailyAllowance: null,
    };

    if (swapDelegationEntry) {
      const metaObject = swapDelegationEntry.meta
        ? JSON.parse(swapDelegationEntry.meta)
        : { allowances: [] };

      const allowances = metaObject.allowances ?? [];
      config.swapAllowance = {
        allowances,
        delegation: swapDelegationEntry.delegation,
      };
    }

    if (dailyDelegationEntry) {
      const metaObject = dailyDelegationEntry.meta
        ? JSON.parse(dailyDelegationEntry.meta)
        : { allowances: [] };

      const allowances = metaObject.allowances ?? [];
      config.dailyAllowance = {
        allowances,
        delegation: dailyDelegationEntry.delegation,
      };
    }
    return config;
  },
);

type GetRemoteSendAllowanceParams = {
  from: Address;
  chainId: Hex;
  asset?: Asset;
};

export const getRemoteSendAllowance = (
  state: RemoteModeState,
  params: GetRemoteSendAllowanceParams,
) => {
  // Check feature flag
  if (!getIsRemoteModeEnabled(state)) {
    return null;
  }

  const { from, chainId, asset } = params;

  const entry = listDelegationEntries(state, {
    filter: {
      from,
      chainId,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
    },
  })[0];

  if (!entry?.meta) {
    return null;
  }

  const meta = JSON.parse(entry.meta) as {
    allowances: DailyAllowance[];
  };

  if (meta.allowances.length === 0) {
    return null;
  }

  const address = asset?.details?.address ?? '';

  const allowance = meta.allowances.find((a) => a.address === address);

  if (!allowance) {
    return null;
  }

  return allowance;
};
