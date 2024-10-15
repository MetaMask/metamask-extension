import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Confirmation } from '../../../../types/confirm';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
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

  const { decimals } = useAssetDetails(txParamsTo, txParamsFrom, txParamsData);

  const { spendingCap, pending } = useApproveTokenSimulation(
    currentConfirmation as TransactionMeta,
    decimals || '0',
  );

  let customSpendingCap = '';
  if (isTxWithSpendingCap) {
    customSpendingCap = spendingCap;
  }

  return { customSpendingCap, pending };
}
