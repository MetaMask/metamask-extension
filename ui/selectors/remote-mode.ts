import { DelegationEntry } from '@metamask/delegation-controller';
import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  DailyAllowance,
  REMOTE_MODES,
  RemoteModeConfig,
} from '../../shared/lib/remote-mode';
import { Asset } from '../ducks/send';
import { PENDING_STATUS_HASH } from '../helpers/constants/transactions';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from './remote-feature-flags';
import { type DelegationState, listDelegationEntries } from './delegation';
import {
  transactionSubSelectorAllChains,
  transactionSubSelector,
  getCurrentNetworkTransactions,
  smartTransactionsListSelector,
  groupAndSortTransactionsByNonce,
  getAllNetworkTransactions,
} from './transactions';
import { getSelectedInternalAccount } from './accounts';

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
export const remoteModeSelectedAddressTxListSelectorAllChain = createSelector(
  getSelectedInternalAccount,
  getAllNetworkTransactions,
  smartTransactionsListSelector,
  (selectedInternalAccount, transactions = [], smTransactions = []) => {
    // TODO: Also check if selectedInternalAccount is hardware wallet
    return transactions
      .filter(({ txParamsOriginal }: TransactionMeta) =>
        txParamsOriginal
          ? txParamsOriginal.from === selectedInternalAccount.address
          : false,
      )
      .filter(({ type }: TransactionMeta) => type !== TransactionType.incoming)
      .concat(smTransactions);
  },
);

// Returns transactions where the selected account is the original sender
export const remoteModeSelectedAddressTxListSelector = createSelector(
  getSelectedInternalAccount,
  getCurrentNetworkTransactions,
  smartTransactionsListSelector,
  (selectedInternalAccount, transactions = [], smTransactions = []) => {
    // TODO: Also check if selectedInternalAccount is hardware wallet
    return transactions
      .filter(({ txParamsOriginal }: TransactionMeta) =>
        txParamsOriginal
          ? txParamsOriginal.from === selectedInternalAccount.address
          : false,
      )
      .filter(({ type }: TransactionMeta) => type !== TransactionType.incoming)
      .concat(smTransactions);
  },
);

export const remoteModeTransactionsSelectorAllChains = createSelector(
  transactionSubSelectorAllChains,
  remoteModeSelectedAddressTxListSelectorAllChain,
  (subSelectorTxList = [], selectedAddressTxList = []) => {
    const txsToRender = selectedAddressTxList.concat(subSelectorTxList);

    return [...txsToRender].sort((a, b) => b.time - a.time);
  },
);

export const remoteModeTransactionsSelector = createSelector(
  transactionSubSelector,
  remoteModeSelectedAddressTxListSelector,
  (subSelectorTxList = [], selectedAddressTxList = []) => {
    const txsToRender = selectedAddressTxList.concat(subSelectorTxList);

    return [...txsToRender].sort((a, b) => b.time - a.time);
  },
);

/**
 * @name remoteModeNonceSortedTransactionsSelectorAllChains
 * @description Returns an array of transactionGroups sorted by nonce in ascending order.
 * @returns {transactionGroup[]}
 */
export const remoteModeNonceSortedTransactionsSelectorAllChains =
  createSelector(remoteModeTransactionsSelectorAllChains, (transactions = []) =>
    groupAndSortTransactionsByNonce(transactions),
  );

/**
 * @name remoteModeNonceSortedTransactionsSelector
 * @description Returns an array of transactionGroups sorted by nonce in ascending order.
 * @returns {transactionGroup[]}
 */
export const remoteModeNonceSortedTransactionsSelector = createSelector(
  remoteModeTransactionsSelector,
  (transactions = []) => groupAndSortTransactionsByNonce(transactions),
);

/**
 * @name remoteModeNonceSortedPendingTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are still pending sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const remoteModeNonceSortedPendingTransactionsSelector = createSelector(
  remoteModeNonceSortedTransactionsSelector,
  (transactions = []) =>
    transactions.filter(
      ({ primaryTransaction }) =>
        primaryTransaction.status in PENDING_STATUS_HASH,
    ),
);

/**
 * @name remoteModeNonceSortedPendingTransactionsSelectorAllChains
 * @description Returns an array of transactionGroups where transactions are still pending sorted by
 * nonce in descending order for all chains.
 * @returns {transactionGroup[]}
 */
export const remoteModeNonceSortedPendingTransactionsSelectorAllChains =
  createSelector(
    remoteModeNonceSortedTransactionsSelectorAllChains,
    (transactions = []) =>
      transactions.filter(
        ({ primaryTransaction }) =>
          primaryTransaction.status in PENDING_STATUS_HASH,
      ),
  );

/**
 * @name remoteModeNonceSortedCompletedTransactionsSelectorAllChains
 * @description Returns an array of transactionGroups where transactions are confirmed sorted by
 * nonce in descending order for all chains.
 * @returns {transactionGroup[]}
 */
export const remoteModeNonceSortedCompletedTransactionsSelectorAllChains =
  createSelector(
    remoteModeNonceSortedTransactionsSelectorAllChains,
    (transactions = []) =>
      transactions
        .filter(
          ({ primaryTransaction }) =>
            !(primaryTransaction.status in PENDING_STATUS_HASH),
        )
        .reverse(),
  );

/**
 * @name remoteModeNonceSortedCompletedTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are confirmed sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const remoteModeNonceSortedCompletedTransactionsSelector =
  createSelector(
    remoteModeNonceSortedTransactionsSelector,
    (transactions = []) =>
      transactions
        .filter(
          ({ primaryTransaction }) =>
            !(primaryTransaction.status in PENDING_STATUS_HASH),
        )
        .reverse(),
  );
