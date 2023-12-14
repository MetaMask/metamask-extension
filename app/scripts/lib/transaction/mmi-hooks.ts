import { TransactionMeta } from '@metamask/transaction-controller';

/**
 * Whether or not to skip publishing the transaction.
 *
 * @param txMeta - The transaction meta.
 * @param signedEthTx - Signed Ethereum transaction.
 * @param addTransactionToWatchList
 */
export function afterTransactionSign(
  txMeta: TransactionMeta,
  signedEthTx: any,
  addTransactionToWatchList: (
    custodianTransactionId: string | undefined,
    from?: string,
    bufferType?: string,
    isSignedMessage?: boolean,
  ) => Promise<void>,
): boolean {
  // MMI does not broadcast transactions, as that is the responsibility of the custodian
  if (!txMeta?.custodyStatus) {
    return true;
  }

  txMeta.custodyId = signedEthTx.custodian_transactionId;
  txMeta.custodyStatus = signedEthTx.transactionStatus;

  addTransactionToWatchList(txMeta.custodyId, txMeta.txParams.from);

  return false;
}

/**
 * Whether or not should run logic before publishing the transaction.
 *
 * @param txMeta - The transaction meta.
 */
export function beforeTransactionPublish(txMeta: TransactionMeta): boolean {
  // MMI does not broadcast transactions, as that is the responsibility of the custodian
  return !txMeta?.custodyStatus;
}

/**
 * Gets additional sign arguments`.
 *
 * @param txMeta - The transaction meta.
 */
export function getAdditionalSignArguments(
  txMeta: TransactionMeta,
): (TransactionMeta | undefined)[] {
  return [txMeta.custodyStatus ? txMeta : undefined];
}

/**
 * Whether or not should run the logic before approve the transaction when transaction controller is rebooted.
 *
 * @param txMeta - The transaction meta.
 */

export function beforeTransactionApproveOnInit(
  txMeta: TransactionMeta,
): boolean {
  return !txMeta?.custodyStatus;
}

/**
 * Whether or not should run the logic before checking the transaction when checking pending transactions.
 *
 * @param txMeta - The transaction meta.
 */
export function beforeCheckPendingTransaction(
  txMeta: TransactionMeta,
): boolean {
  return !txMeta?.custodyId;
}
