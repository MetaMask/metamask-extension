import React from 'react';
import { useSelector } from 'react-redux';
import type { Transaction } from '@metamask/keyring-api';
import { isCrossChain } from '@metamask/bridge-controller';
import { MultichainTransactionDetailsModal } from '../../app/multichain-transaction-details-modal';
import MultichainBridgeTransactionDetailsModal from '../../app/multichain-bridge-transaction-details-modal/multichain-bridge-transaction-details-modal';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';

type Props = {
  transaction: Transaction;
  onClose: () => void;
};

export const NonEvmDetailsModal = ({ transaction, onClose }: Props) => {
  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);
  const bridgeHistoryItem = bridgeHistoryItems[transaction.id];
  const { quote } = bridgeHistoryItem ?? {};

  if (
    bridgeHistoryItem &&
    isCrossChain(quote?.srcChainId, quote?.destChainId)
  ) {
    return (
      <MultichainBridgeTransactionDetailsModal
        transaction={transaction}
        bridgeHistoryItem={bridgeHistoryItem}
        onClose={onClose}
      />
    );
  }

  return (
    <MultichainTransactionDetailsModal
      transaction={transaction}
      onClose={onClose}
    />
  );
};
