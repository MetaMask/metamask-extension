import { StatusTypes } from '@metamask/bridge-controller';
import { TransactionStatus } from '@metamask/transaction-controller';

/**
 * Internal type defining the relevant parts of a transaction object
 * needed for bridge status utility functions.
 */
type BridgeTransaction = {
  isBridgeTx: boolean;
  bridgeInfo?: {
    status?: string;
    destTxHash?: string;
  };
};

export function isBridgeComplete(transaction: BridgeTransaction): boolean {
  return Boolean(
    transaction.isBridgeTx &&
      transaction.bridgeInfo &&
      (transaction.bridgeInfo.status === StatusTypes.COMPLETE ||
        transaction.bridgeInfo.status === 'COMPLETE') &&
      typeof transaction.bridgeInfo.destTxHash === 'string' &&
      transaction.bridgeInfo.destTxHash.length > 0,
  );
}

export function isBridgeFailed(
  transaction: BridgeTransaction,
  baseStatusKey: string,
): boolean {
  const bridgeFailed = Boolean(
    transaction.isBridgeTx &&
      transaction.bridgeInfo &&
      (transaction.bridgeInfo.status === StatusTypes.FAILED ||
        transaction.bridgeInfo.status === 'FAILED'),
  );
  const baseFailed = baseStatusKey === TransactionStatus.failed;

  return bridgeFailed || baseFailed;
}

export function getBridgeStatusKey(
  transaction: BridgeTransaction,
  baseStatusKey: string,
): string {
  if (!transaction.isBridgeTx || !transaction.bridgeInfo) {
    return baseStatusKey;
  }

  if (isBridgeFailed(transaction, baseStatusKey)) {
    return TransactionStatus.failed;
  }

  if (
    isBridgeComplete(transaction) &&
    baseStatusKey === TransactionStatus.confirmed
  ) {
    return TransactionStatus.confirmed;
  }

  return TransactionStatus.submitted;
}
