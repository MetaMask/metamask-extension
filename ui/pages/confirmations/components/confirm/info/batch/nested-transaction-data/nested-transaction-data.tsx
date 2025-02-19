import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import { NestedTransaction } from '../nested-transaction';
import { Box } from '../../../../../../../components/component-library';

export function NestedTransactionData() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};

  if (!nestedTransactions) {
    return null;
  }

  return (
    <Box>
      {nestedTransactions.map((nestedTransaction, index) => (
        <NestedTransaction key={index} index={index} />
      ))}
    </Box>
  );
}
