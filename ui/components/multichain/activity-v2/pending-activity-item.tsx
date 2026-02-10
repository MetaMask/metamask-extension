import React from 'react';
import TransactionListItem from '../../app/transaction-list-item';
import { isTransactionEarliestNonce } from '../../../hooks/useEarliestNonceByChain';
import { TransactionGroup } from '../../../../shared/acme-controller/types';

type Props = {
  transactionGroup: TransactionGroup;
  earliestNonceByChain: Record<string, number>;
};

// Thin wrapper around v1's TransactionListItem for pending transactions
export const PendingActivityItem = ({
  transactionGroup,
  earliestNonceByChain,
}: Props) => {
  const { nonce, initialTransaction } = transactionGroup;
  const chainId = initialTransaction?.chainId;

  const isEarliestNonce = isTransactionEarliestNonce(
    nonce,
    chainId,
    earliestNonceByChain,
  );

  return (
    <TransactionListItem
      transactionGroup={transactionGroup}
      isEarliestNonce={isEarliestNonce}
      chainId={chainId}
    />
  );
};
