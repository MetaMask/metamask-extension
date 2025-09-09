import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 175;

const SOLANA_MAINNET_ADDRESS = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

type TransactionStateEntry = {
  transactions: unknown[];
  next: string | null;
  lastUpdated: number;
};

type NewTransactionsState = {
  [accountId: string]: {
    [chainId: string]: TransactionStateEntry;
  };
};

/**
 * Validate that the given entry is a valid transaction state entry.
 *
 * @param entry - The entry to validate.
 * @returns True if the entry is valid, false otherwise.
 */
function isValidTransactionStateEntry(
  entry: unknown,
): entry is TransactionStateEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    hasProperty(entry, 'transactions') &&
    hasProperty(entry, 'next') &&
    hasProperty(entry, 'lastUpdated') &&
    Array.isArray(entry.transactions) &&
    (typeof entry.next === 'string' || entry.next === null) &&
    typeof entry.lastUpdated === 'number'
  );
}

/**
 * This migration transforms the MultichainTransactionsController state structure
 * to support per-chain transaction storage. It moves transactions from directly
 * under the account to be nested under the chainId (Solana in this case).
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (
    !hasProperty(state, 'MultichainTransactionsController') ||
    !isObject(state.MultichainTransactionsController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid MultichainTransactionsController state: ${typeof state.MultichainTransactionsController}`,
      ),
    );
    return state;
  }

  const transactionsController = state.MultichainTransactionsController;

  if (
    !hasProperty(transactionsController, 'nonEvmTransactions') ||
    !isObject(transactionsController.nonEvmTransactions)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid nonEvmTransactions state: ${typeof transactionsController.nonEvmTransactions}`,
      ),
    );
    return state;
  }

  const { nonEvmTransactions } = transactionsController;
  const newNonEvmTransactions: NewTransactionsState = {};

  // Migrate each account's transactions to the new nested structure
  for (const [accountId, accountTransactions] of Object.entries(
    nonEvmTransactions,
  )) {
    if (!isValidTransactionStateEntry(accountTransactions)) {
      throw new Error(
        `Invalid transaction state entry for account ${accountId}: expected TransactionStateEntry, got ${typeof accountTransactions}`,
      );
    }

    // Creates the new structure for this account
    // Since we know the transactions are from Solana, we use the Solana chainId
    // 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' is Solana mainnet (the only supported so far)
    newNonEvmTransactions[accountId] = {
      [SOLANA_MAINNET_ADDRESS]: {
        transactions: accountTransactions.transactions,
        next: accountTransactions.next,
        lastUpdated: accountTransactions.lastUpdated,
      },
    };
  }

  // Update the state with the new structure
  transactionsController.nonEvmTransactions = newNonEvmTransactions;

  return state;
}
