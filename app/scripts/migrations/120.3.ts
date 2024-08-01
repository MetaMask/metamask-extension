import { RuntimeObject, hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import log from 'loglevel';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 120.3;

/**
 * This migration trims the size of any large transaction histories. This will
 * result in some loss of information, but the impact is minor. The lost data
 * is only used in the "Activity log" on the transaction details page.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
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

function transformState(state: Record<string, unknown>) {
  if (!hasProperty(state, 'TransactionController')) {
    log.warn(`Migration ${version}: Missing TransactionController state`);
    return state;
  } else if (!isObject(state.TransactionController)) {
    global.sentry?.captureException(
      `Migration ${version}: Invalid TransactionController state of type '${typeof state.TransactionController}'`,
    );
    return state;
  }

  const transactionControllerState = state.TransactionController;

  if (!hasProperty(transactionControllerState, 'transactions')) {
    log.warn(
      `Migration ${version}: Missing TransactionController transactions`,
    );
    return state;
  } else if (!Array.isArray(transactionControllerState.transactions)) {
    global.sentry?.captureException(
      `Migration ${version}: Invalid TransactionController transactions state of type '${typeof transactionControllerState.transactions}'`,
    );
    return state;
  }

  const validTransactions =
    transactionControllerState.transactions.filter(isObject);
  if (
    transactionControllerState.transactions.length !== validTransactions.length
  ) {
    const invalidTransaction = transactionControllerState.transactions.find(
      (transaction) => !isObject(transaction),
    );
    global.sentry?.captureException(
      `Migration ${version}: Invalid transaction of type '${typeof invalidTransaction}'`,
    );
    return state;
  }

  const validHistoryTransactions = validTransactions.filter(
    hasValidTransactionHistory,
  );
  if (validHistoryTransactions.length !== validTransactions.length) {
    const invalidTransaction = validTransactions.find(
      (transaction) => !hasValidTransactionHistory(transaction),
    );
    global.sentry?.captureException(
      `Migration ${version}: Invalid transaction history of type '${typeof invalidTransaction?.history}'`,
    );
    return state;
  }

  for (const transaction of validHistoryTransactions) {
    if (transaction.history && transaction.history.length > 100) {
      transaction.history = transaction.history.slice(0, 100);
    }
  }

  return state;
}

/**
 * Check whether the given object has a valid `history` property, or no `history`
 * property. We just check that it's an array, we don't validate the contents.
 *
 * @param transaction - The object to validate.
 * @returns True if the given object was valid, false otherwise.
 */
function hasValidTransactionHistory(
  transaction: RuntimeObject,
): transaction is RuntimeObject & {
  history: undefined | unknown[];
} {
  return (
    !hasProperty(transaction, 'history') || Array.isArray(transaction.history)
  );
}
