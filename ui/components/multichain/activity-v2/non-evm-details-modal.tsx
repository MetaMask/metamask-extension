import React from 'react';
import { useSelector } from 'react-redux';
import type { Transaction } from '@metamask/keyring-api';
import { MultichainTransactionDetailsModal } from '../../app/multichain-transaction-details-modal';
import MultichainBridgeTransactionDetailsModal from '../../app/multichain-bridge-transaction-details-modal/multichain-bridge-transaction-details-modal';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { isAsyncSwap } from '../../../../shared/lib/bridge-status/utils';

type Props = {
  transaction: Transaction;
  onClose: () => void;
};

export const NonEvmDetailsModal = ({ transaction, onClose }: Props) => {
  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);
  const bridgeHistoryItem = bridgeHistoryItems[transaction.id];

  if (bridgeHistoryItem && isAsyncSwap(bridgeHistoryItem)) {
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
