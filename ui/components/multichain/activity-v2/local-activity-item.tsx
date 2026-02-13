import React from 'react';
import LegacyTransactionListItem from '../../app/transaction-list-item';
import { isTransactionEarliestNonce } from '../../../hooks/useEarliestNonceByChain';
import { TransactionGroup } from '../../../../shared/acme-controller/types';

type Props = {
  transactionGroup: TransactionGroup;
  earliestNonceByChain: Record<string, number>;
};

// Wrapper around v1's TransactionListItem for local (Redux-sourced) transactions
export const LocalActivityItem = ({
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
    <LegacyTransactionListItem
      transactionGroup={transactionGroup}
      isEarliestNonce={isEarliestNonce}
      chainId={chainId}
    />
  );
};
