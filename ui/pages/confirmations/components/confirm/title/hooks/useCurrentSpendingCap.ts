import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { resolveApprovalTokenContractAddress } from '../../../../../../../shared/lib/transaction.utils';
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

  const tokenAddress = isTxWithSpendingCap
    ? resolveApprovalTokenContractAddress(currentConfirmation)
    : null;
  const txParamsFrom = isTxWithSpendingCap
    ? currentConfirmation.txParams.from
    : null;
  const txParamsData = isTxWithSpendingCap
    ? currentConfirmation.txParams.data
    : null;
  const chainId = isTxWithSpendingCap ? currentConfirmation.chainId : null;

  const { decimals } = useAssetDetails(
    tokenAddress,
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

  return {
    customSpendingCap,
    pending: isTxWithSpendingCap && pending,
  };
}
