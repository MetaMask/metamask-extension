import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';

import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import type { Confirmation } from '../../../../types/confirm';
import { useApproveTokenSimulation } from '../../info/approve/hooks/use-approve-token-simulation';

const isTransactionMeta = (
  confirmation: Confirmation | undefined,
): confirmation is TransactionMeta => {
  return (
    confirmation !== undefined &&
    (confirmation as TransactionMeta).txParams !== undefined
  );
};

export function useCurrentSpendingCap(currentConfirmation: Confirmation) {
  const isTxWithSpendingCap =
    isTransactionMeta(currentConfirmation) &&
    [
      TransactionType.tokenMethodApprove,
      TransactionType.tokenMethodIncreaseAllowance,
    ].includes(currentConfirmation.type as TransactionType);

  const txParamsTo = isTxWithSpendingCap
    ? currentConfirmation.txParams.to
    : null;
  const txParamsFrom = isTxWithSpendingCap
    ? currentConfirmation.txParams.from
    : null;
  const txParamsData = isTxWithSpendingCap
    ? currentConfirmation.txParams.data
    : null;
  const chainId = isTxWithSpendingCap ? currentConfirmation.chainId : null;

  const { decimals } = useAssetDetails(
    txParamsTo,
    txParamsFrom,
    txParamsData,
    chainId,
  );

  const { spendingCap, pending } = useApproveTokenSimulation(
    currentConfirmation as TransactionMeta,
    decimals,
  );

  let customSpendingCap = '';
  if (isTxWithSpendingCap) {
    customSpendingCap = spendingCap;
  }

  return { customSpendingCap, pending };
}
