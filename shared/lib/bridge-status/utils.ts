import { isCrossChain, StatusTypes } from '@metamask/bridge-controller';
import { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { Transaction } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';

export function isBridgeComplete(
  transaction: Transaction,
  { status, quote }: BridgeHistoryItem,
): boolean {
  return Boolean(
    isCrossChain(quote.srcChainId, quote.destChainId) &&
      (status.status === StatusTypes.COMPLETE ||
        transaction.status === TransactionStatus.confirmed) &&
      status.destChain?.txHash,
  );
}

export function isBridgeFailed(
  transaction: Transaction,
  { quote, status }: BridgeHistoryItem,
) {
  const bridgeFailed = Boolean(
    isCrossChain(quote.srcChainId, quote.destChainId) &&
      status.status === StatusTypes.FAILED,
  );

  return bridgeFailed || transaction.status === TransactionStatus.failed;
}
