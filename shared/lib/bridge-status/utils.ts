import {
  isCrossChain,
  isTronChainId,
  StatusTypes,
} from '@metamask/bridge-controller';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { type Transaction, TransactionStatus } from '@metamask/keyring-api';

const isTronSameChainSwap = ({
  srcChainId,
  destChainId,
}: BridgeHistoryItem['quote']): boolean => {
  return !isCrossChain(srcChainId, destChainId) && isTronChainId(srcChainId);
};

export function isAsyncSwap(bridgeHistoryItem: BridgeHistoryItem): boolean {
  const { quote } = bridgeHistoryItem;
  // Async swaps include classic cross-chain bridge swaps and same-chain Tron swaps
  // that still complete in multiple lifecycle steps.
  return (
    isCrossChain(quote.srcChainId, quote.destChainId) ||
    isTronSameChainSwap(quote)
  );
}

export function isBridgeComplete(
  bridgeHistoryItem: BridgeHistoryItem,
): boolean {
  const { status } = bridgeHistoryItem;
  return Boolean(
    isAsyncSwap(bridgeHistoryItem) &&
      status.srcChain.txHash &&
      status.status === StatusTypes.COMPLETE,
  );
}

export function isBridgeFailed(
  transaction: Transaction,
  bridgeHistoryItem: BridgeHistoryItem,
) {
  const { status } = bridgeHistoryItem;
  const bridgeFailed = Boolean(
    isAsyncSwap(bridgeHistoryItem) && status.status === StatusTypes.FAILED,
  );

  return bridgeFailed || transaction.status === TransactionStatus.Failed;
}
