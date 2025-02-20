import React from 'react';
import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import { Box } from '../../../../../../../components/component-library';
import { SpendingCap } from '../../approve/spending-cap/spending-cap';

export function BatchSpendingCap() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};

  if (!nestedTransactions?.length) {
    return null;
  }

  return (
    <Box>
      {nestedTransactions.map((nestedTransaction, index) => (
        <NestedTransactionSpendingCap
          key={index}
          nestedTransaction={nestedTransaction}
        />
      ))}
    </Box>
  );
}

function NestedTransactionSpendingCap({
  nestedTransaction,
}: {
  nestedTransaction: BatchTransactionParams;
}) {
  const { data, to } = nestedTransaction;

  return (
    <SpendingCap data={data} to={to} setIsOpenEditSpendingCapModal={() => {}} />
  );
}
