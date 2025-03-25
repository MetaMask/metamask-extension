import React, { useCallback, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
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
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { updateAtomicBatchData } from '../../../../../../../store/actions/transaction-controller';

export function BatchSimulationDetails() {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { id, nestedTransactions } = transactionMeta;

  const { value: approveBalanceChanges } =
    useBatchApproveBalanceChanges() ?? {};

  const [isEditApproveModalOpen, setIsEditApproveModalOpen] = useState(false);

  const [nestedTransactionIndexToEdit, setNestedTransactionIndexToEdit] =
    useState<number | undefined>();

  const handleEdit = useCallback((balanceChange: ApprovalBalanceChange) => {
    setNestedTransactionIndexToEdit(balanceChange.nestedTransactionIndex);
    setIsEditApproveModalOpen(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (data: Hex) => {
      if (nestedTransactionIndexToEdit === undefined) {
        return;
      }

      await updateAtomicBatchData({
        transactionId: id,
        transactionData: data,
        transactionIndex: nestedTransactionIndexToEdit,
      });
    },
    [id, nestedTransactionIndexToEdit],
  );

  const finalBalanceChanges = approveBalanceChanges?.map((change) => ({
    ...change,
    onEdit:
      change.asset.standard === TokenStandard.ERC20
        ? () => handleEdit(change)
        : undefined,
  }));

  const approveRow: StaticRow = {
    label: t('confirmSimulationApprove'),
    balanceChanges: finalBalanceChanges ?? [],
  };

  const nestedTransactionToEdit =
    nestedTransactionIndexToEdit === undefined
      ? undefined
      : nestedTransactions?.[nestedTransactionIndexToEdit];

  return (
    <>
      {isEditApproveModalOpen && (
        <EditSpendingCapModal
          data={nestedTransactionToEdit?.data}
          isOpenEditSpendingCapModal={true}
          onSubmit={handleEditSubmit}
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
