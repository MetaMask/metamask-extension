/**
 * Whether or not to skip publishing the transaction.
 *
 * @param txMeta - The transaction meta.
 * @param signedEthTx - Signed Ethereum transaction.
 * @param addTransactionToWatchList
 */
export const afterSign = (
  txMeta: any,
  signedEthTx: any,
  addTransactionToWatchList: (
    custodianTransactionId: string | undefined,
    from?: string,
    bufferType?: string,
    isSignedMessage?: boolean,
  ) => Promise<void>,
): boolean => {
  // MMI does not broadcast transactions, as that is the responsibility of the custodian
  if (txMeta?.custodyStatus) {
    txMeta.custodyId = signedEthTx.custodian_transactionId;
    txMeta.custodyStatus = signedEthTx.transactionStatus;
    addTransactionToWatchList(txMeta.custodyId, txMeta.txParams.from);
    return true;
  }
  return false;
};

/**
 * Whether or not should run logic before publishing the transaction.
 *
 * @param txMeta - The transaction meta.
 */
export const beforePublish = (txMeta: any): boolean => {
  // MMI does not broadcast transactions, as that is the responsibility of the custodian
  if (txMeta?.custodyStatus) {
    return true;
  }
  return false;
};

/**
 * Gets additional sign arguments`.
 *
 * @param args - The list of arguments to filter.
 */
export const getAdditionalSignArguments = <T>(...args: T[]): T[] | T => {
  if (args.length === 1) {
    return args[0];
  }
  return args.filter((arg) => arg !== undefined);
};
