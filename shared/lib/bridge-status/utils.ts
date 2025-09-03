import { isCrossChain, StatusTypes } from '@metamask/bridge-controller';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { type Transaction, TransactionStatus } from '@metamask/keyring-api';

export function isBridgeComplete({
  status,
  quote,
}: BridgeHistoryItem): boolean {
  return Boolean(
    isCrossChain(quote.srcChainId, quote.destChainId) &&
      status.srcChain.txHash &&
      status.status === StatusTypes.COMPLETE,
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

  return bridgeFailed || transaction.status === TransactionStatus.Failed;
}
