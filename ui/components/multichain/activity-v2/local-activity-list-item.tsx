import React from 'react';
import LegacyTransactionListItem from '../../app/transaction-list-item';
import SmartTransactionListItem from '../../app/transaction-list-item/smart-transaction-list-item.component';
import { isTransactionEarliestNonce } from '../../../hooks/useEarliestNonceByChain';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';

type Props = {
  transactionGroup: TransactionGroup;
  earliestNonceByChain: Record<string, number>;
};

// Wrapper around TransactionListItem / SmartTransactionListItem for local transactions
export const LocalActivityListItem = ({
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

  if (initialTransaction?.isSmartTransaction) {
    return (
      <SmartTransactionListItem
        smartTransaction={initialTransaction}
        transactionGroup={transactionGroup}
        isEarliestNonce={isEarliestNonce}
        chainId={chainId}
      />
    );
  }

  return (
    <LegacyTransactionListItem
      transactionGroup={transactionGroup}
      isEarliestNonce={isEarliestNonce}
      chainId={chainId}
    />
  );
};
