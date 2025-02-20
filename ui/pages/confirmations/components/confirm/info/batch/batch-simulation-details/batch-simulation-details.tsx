import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  SimulationDetails,
  StaticRow,
} from '../../../../simulation-details/simulation-details';
import { useBatchApproveBalanceChanges } from '../../hooks/useBatchApproveTokenSimulation';
import { useConfirmContext } from '../../../../../context/confirm';

export function BatchSimulationDetails() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { value: approveBalanceChanges } =
    useBatchApproveBalanceChanges() ?? {};

  const approveRow: StaticRow = {
    label: 'You approve',
    balanceChanges: approveBalanceChanges ?? [],
  };

  return (
    <SimulationDetails
      transaction={transactionMeta}
      staticRows={[approveRow]}
      isTransactionsRedesign
      enableMetrics
    />
  );
}
