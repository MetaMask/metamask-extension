import type { TransactionMeta } from '@metamask/transaction-controller';
import { parseMusdHumanAmount } from '../../confirmations/utils/pay-amount-commit';
import type { MoneyPayMessenger } from './pay-context';
import {
  beginAmountCommit,
  clearAmountCommitIfCurrent,
  pruneStaleAmountCommits,
} from './amount-commit-intent';

export async function withAmountCommitIntent<UpdateResult>(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
  performUpdate: (
    isCurrent: () => boolean,
    amountRaw: bigint,
    transaction: TransactionMeta,
  ) => Promise<UpdateResult | false>,
  parseAmount: (
    amountHuman: string,
  ) => bigint | undefined = parseMusdHumanAmount,
): Promise<UpdateResult | false> {
  pruneStaleAmountCommits(messenger);

  const amountRaw = parseAmount(amountHuman);
  if (amountRaw === undefined) {
    return false as UpdateResult;
  }

  const { transactions } = messenger.call('TransactionController:getState');
  const transaction = transactions.find((item) => item.id === transactionId);
  if (!transaction) {
    return false as UpdateResult;
  }

  const isCurrent = beginAmountCommit(transactionId);

  try {
    return await performUpdate(isCurrent, amountRaw, transaction);
  } catch (error) {
    if (!isCurrent()) {
      return false as UpdateResult;
    }
    throw error;
  } finally {
    clearAmountCommitIfCurrent(transactionId, isCurrent);
  }
}
