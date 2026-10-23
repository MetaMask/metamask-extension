import {
  TransactionStatus,
  type TransactionControllerState,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { subscribeToMessengerEvent } from './background-connection';

export type HardwareSigningState = Pick<
  TransactionControllerState,
  'transactions' | 'batchTransactionCounts'
>;

/**
 * Checks whether every expected funding transaction has been signed.
 *
 * @param transactionId - Parent transaction ID.
 * @param state - Current TransactionController state.
 * @param state.batchTransactionCounts
 * @param state.transactions
 * @param expectedQuoteCount - Number of quote transaction groups expected.
 * @returns Whether all expected funding transactions are signed.
 */
export function haveRequiredTransactionsBeenSigned(
  transactionId: string,
  { batchTransactionCounts, transactions }: HardwareSigningState,
  expectedQuoteCount: number,
): boolean {
  const requiredTransactionIds =
    transactions.find((transaction) => transaction.id === transactionId)
      ?.requiredTransactionIds ?? [];
  const requiredTransactions = requiredTransactionIds.map((id) =>
    transactions.find((transaction) => transaction.id === id),
  );

  if (
    requiredTransactions.length === 0 ||
    requiredTransactions.some((transaction) => !transaction)
  ) {
    return false;
  }

  const transactionsByGroup = new Map<string, TransactionMeta[]>();
  for (const transaction of requiredTransactions as TransactionMeta[]) {
    const groupId = transaction.batchId ?? transaction.id;
    transactionsByGroup.set(groupId, [
      ...(transactionsByGroup.get(groupId) ?? []),
      transaction,
    ]);
  }

  if (transactionsByGroup.size < expectedQuoteCount) {
    return false;
  }

  return [...transactionsByGroup.entries()].every(
    ([groupId, groupTransactions]) => {
      const expectedTransactionCount =
        batchTransactionCounts[groupId] ?? groupTransactions.length;

      return (
        groupTransactions.length >= expectedTransactionCount &&
        groupTransactions.every(({ status }) =>
          [
            TransactionStatus.signed,
            TransactionStatus.submitted,
            TransactionStatus.confirmed,
          ].includes(status),
        )
      );
    },
  );
}

type HardwareSigningCompletionListenerOptions = {
  transactionId: string;
  expectedQuoteCount: number;
  getState: () => Promise<HardwareSigningState>;
  onComplete: () => void;
};

/**
 * Watches funding transactions and reports when device signing is complete.
 *
 * @param options - Listener options.
 * @param options.transactionId - Parent transaction ID.
 * @param options.expectedQuoteCount - Number of quote groups expected.
 * @param options.getState - Reads fresh TransactionController state.
 * @param options.onComplete - Called once all funding transactions are signed.
 * @returns An asynchronous cleanup function.
 */
export async function listenForHardwareSigningCompletion({
  transactionId,
  expectedQuoteCount,
  getState,
  onComplete,
}: HardwareSigningCompletionListenerOptions): Promise<() => Promise<void>> {
  let isListening = true;
  let isComplete = false;
  let checkQueue = Promise.resolve();

  const unsubscribe = await subscribeToMessengerEvent<
    [{ transactionMeta: TransactionMeta }]
  >(
    'TransactionController:transactionStatusUpdated',
    ([{ transactionMeta }]) => {
      if (
        !isListening ||
        isComplete ||
        ![
          TransactionStatus.signed,
          TransactionStatus.submitted,
          TransactionStatus.confirmed,
        ].includes(transactionMeta.status)
      ) {
        return;
      }

      checkQueue = checkQueue
        .then(async () => {
          if (isComplete) {
            return;
          }

          const state = await getState();
          const parentTransaction = state.transactions.find(
            (transaction) => transaction.id === transactionId,
          );

          if (
            !parentTransaction?.requiredTransactionIds?.includes(
              transactionMeta.id,
            ) ||
            !haveRequiredTransactionsBeenSigned(
              transactionId,
              state,
              expectedQuoteCount,
            )
          ) {
            return;
          }

          isComplete = true;
          onComplete();
        })
        .catch(() => undefined);
    },
  );

  return async () => {
    isListening = false;
    await checkQueue;
    await unsubscribe();
  };
}
