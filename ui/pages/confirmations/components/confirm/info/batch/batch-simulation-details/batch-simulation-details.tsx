import React, { useCallback, useMemo, useState } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
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
import { updateAtomicBatchData } from '../../../../../../../store/controller-actions/transaction-controller';
import { useIsUpgradeTransaction } from '../../hooks/useIsUpgradeTransaction';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function BatchSimulationDetails() {
  const t = useI18nContext();
  const { isUpgradeOnly } = useIsUpgradeTransaction();

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

  if (
    transactionMeta?.type === TransactionType.revokeDelegation ||
    isUpgradeOnly
  ) {
    return null;
  }

  const approveRows: StaticRow[] = useMemo(() => {
    const finalBalanceChanges = approveBalanceChanges?.map((change) => ({
      ...change,
      onEdit:
        change.asset.standard === TokenStandard.ERC20
          ? () => handleEdit(change)
          : undefined,
    }));

    return [
      {
        label: t('confirmSimulationApprove'),
        balanceChanges: finalBalanceChanges ?? [],
      },
    ];
  }, [approveBalanceChanges, handleEdit]);

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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={handleEditSubmit}
          setIsOpenEditSpendingCapModal={setIsEditApproveModalOpen}
          to={nestedTransactionToEdit?.to}
        />
      )}
      <SimulationDetails
        transaction={transactionMeta}
        staticRows={approveRows}
        isTransactionsRedesign
        enableMetrics
      />
    </>
  );
}
