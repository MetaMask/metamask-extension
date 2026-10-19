import { TransactionStatus } from '@metamask/transaction-controller';
import type { MoneyPayMessenger } from './pay-context';

const latestIntentByTransactionId = new Map<string, number>();

export function beginAmountCommit(transactionId: string): () => boolean {
  const intent = (latestIntentByTransactionId.get(transactionId) ?? 0) + 1;
  latestIntentByTransactionId.set(transactionId, intent);
  return () => latestIntentByTransactionId.get(transactionId) === intent;
}

export function clearAmountCommitIfCurrent(
  transactionId: string,
  isCurrent: () => boolean,
): void {
  if (isCurrent()) {
    latestIntentByTransactionId.delete(transactionId);
  }
}

export function pruneStaleAmountCommits(messenger: MoneyPayMessenger): void {
  if (latestIntentByTransactionId.size === 0) {
    return;
  }

  const { transactions } = messenger.call('TransactionController:getState');
  const transactionsById = new Map(
    transactions.map((transaction) => [transaction.id, transaction]),
  );

  for (const transactionId of latestIntentByTransactionId.keys()) {
    const transaction = transactionsById.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.unapproved) {
      latestIntentByTransactionId.delete(transactionId);
    }
  }
}
