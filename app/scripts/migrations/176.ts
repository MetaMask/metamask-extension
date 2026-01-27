import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 176;

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
 * Check if the account data is already in the new nested format.
 * The new format has chainId keys (e.g., 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')
 * containing TransactionStateEntry objects.
 *
 * @param entry - The entry to check.
 * @returns True if already in the new format, false otherwise.
 */
function isAlreadyMigrated(entry: unknown): boolean {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }

  // Check if this looks like the new format by examining its properties
  // In the new format, the keys should be chainId strings (containing ':')
  // and values should be TransactionStateEntry objects
  const keys = Object.keys(entry);

  // If it has no keys, it's empty and can be considered already migrated
  if (keys.length === 0) {
    return true;
  }

  // Check if at least one key looks like a chainId (contains ':')
  // and its value is a valid TransactionStateEntry
  for (const key of keys) {
    if (key.includes(':') && hasProperty(entry, key)) {
      const value = (entry as Record<string, unknown>)[key];
      if (isValidTransactionStateEntry(value)) {
        return true;
      }
    }
  }

  return false;
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
    console.warn(
      'Skipping migration. MultichainTransactionsController state not found.',
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
    // Check if this account is already in the new format
    if (isAlreadyMigrated(accountTransactions)) {
      // Already migrated, keep the existing structure
      newNonEvmTransactions[accountId] = accountTransactions as {
        [chainId: string]: TransactionStateEntry;
      };
      continue;
    }

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
