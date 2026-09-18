import type { V1TransactionByHashResponse } from '@metamask/core-backend';

export function isSpamTransaction(transaction: V1TransactionByHashResponse) {
  return transaction.transactionProtocol === 'SPAM_TOKEN';
}
