import React from 'react';
import { BridgeHistoryItem } from '../../../../app/scripts/controllers/bridge-status/types';
import { UseBridgeDataProps } from '../../../pages/bridge/utils/useBridgeData';

const getTxIndex = (
  srcChainTxHash: string | undefined,
  destChainTxHash: string | undefined,
) => {
  if (
    (!srcChainTxHash && !destChainTxHash) ||
    (srcChainTxHash && !destChainTxHash)
  ) {
    return 1;
  }

  if (srcChainTxHash && destChainTxHash) {
    return 2;
  }

  throw new Error('Not possible to have dest chain tx without src chain tx');
};

export default function BridgeProcessSteps({
  bridgeTxHistoryItem,
  transactionGroup,
}: {
  bridgeTxHistoryItem: BridgeHistoryItem;
  transactionGroup: UseBridgeDataProps['transactionGroup'];
}) {
  const { initialTransaction } = transactionGroup;
  const srcChainTxHash = bridgeTxHistoryItem?.status?.srcChain.txHash;
  const destChainTxHash = bridgeTxHistoryItem?.status?.destChain?.txHash;

  const txIndex = getTxIndex(srcChainTxHash, destChainTxHash);

  return (
    <div>
      <div>status: {bridgeTxHistoryItem?.status?.status}</div>
      <div>
        tx 1:{' '}
        {`${(srcChainTxHash || initialTransaction.hash)?.substring(0, 6)}...`},{' '}
        {transactionGroup.initialTransaction?.status}
      </div>
      <div>tx 2: {`${destChainTxHash?.substring(0, 6)}...`}</div>
      <div>Transaction {txIndex} of 2</div>
    </div>
  );
}
