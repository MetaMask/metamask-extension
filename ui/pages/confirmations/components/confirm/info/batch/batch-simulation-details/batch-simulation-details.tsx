import React, { useCallback, useState } from 'react';
import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  SimulationDetails,
  StaticRow,
} from '../../../../simulation-details/simulation-details';
import {
  ApprovalBalanceChange,
  useBatchApproveBalanceChanges,
} from '../../hooks/useBatchApproveBalanceChanges';
import { useConfirmContext } from '../../../../../context/confirm';
import { EditSpendingCapModal } from '../../approve/edit-spending-cap-modal/edit-spending-cap-modal';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';

export function BatchSimulationDetails() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { value: approveBalanceChanges } =
    useBatchApproveBalanceChanges() ?? {};

  const [isEditApproveModalOpen, setIsEditApproveModalOpen] = useState(false);

  const [nestedTransactionToEdit, setNestedTransactionToEdit] = useState<
    BatchTransactionParams | undefined
  >();

  const handleEdit = useCallback((balanceChange: ApprovalBalanceChange) => {
    setNestedTransactionToEdit(balanceChange.nestedTransaction);
    setIsEditApproveModalOpen(true);
  }, []);

  const finalBalanceChanges = approveBalanceChanges?.map((change) => ({
    ...change,
    onEdit:
      change.asset.standard === TokenStandard.ERC20
        ? () => handleEdit(change)
        : undefined,
  }));

  const approveRow: StaticRow = {
    label: 'You approve',
    balanceChanges: finalBalanceChanges ?? [],
  };

  return (
    <>
      {isEditApproveModalOpen && (
        <EditSpendingCapModal
          data={nestedTransactionToEdit?.data}
          isOpenEditSpendingCapModal={isEditApproveModalOpen}
          setIsOpenEditSpendingCapModal={setIsEditApproveModalOpen}
          to={nestedTransactionToEdit?.to}
        />
      )}
      <SimulationDetails
        transaction={transactionMeta}
        staticRows={[approveRow]}
        isTransactionsRedesign
        enableMetrics
      />
    </>
  );
}
