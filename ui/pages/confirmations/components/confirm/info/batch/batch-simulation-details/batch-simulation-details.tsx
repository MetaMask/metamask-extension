import React from 'react';
import {
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
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

  const mockTransactionMeta: TransactionMeta = {
    ...transactionMeta,
    simulationData: {
      nativeBalanceChange: {
        previousBalance: '0x123456789',
        newBalance: '0x123456789abcdef',
        difference: '0x123456789123456',
        isDecrease: false,
      },
      tokenBalanceChanges: [
        {
          address: '0x1234567890123456789012345678901234567890',
          previousBalance: '0x123456789',
          newBalance: '0x123456789abcdef',
          difference: '0x123456789123456789123',
          isDecrease: false,
          standard: SimulationTokenStandard.erc20,
        },
        {
          address: '0x2234567890123456789012345678901234567890',
          previousBalance: '0x1',
          newBalance: '0x0',
          difference: '0x1',
          isDecrease: true,
          standard: SimulationTokenStandard.erc721,
          id: '0x123',
        },
      ],
    },
  };

  const approvePositiveBalanceChanges = (approveBalanceChanges ?? []).filter(
    (balanceChange) => balanceChange.amount.gt(0),
  );

  const approveNegativeBalanceChanges = (approveBalanceChanges ?? []).filter(
    (balanceChange) => balanceChange.amount.eq(0),
  );

  const approveRow: StaticRow = {
    label: 'You approve',
    balanceChanges: approvePositiveBalanceChanges,
  };

  const revokeRow: StaticRow = {
    label: 'You revoke',
    balanceChanges: approveNegativeBalanceChanges,
  };

  return (
    <SimulationDetails
      transaction={mockTransactionMeta}
      staticRows={[approveRow, revokeRow]}
      isTransactionsRedesign
      enableMetrics
    />
  );
}
