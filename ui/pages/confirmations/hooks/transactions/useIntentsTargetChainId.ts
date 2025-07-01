import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { Hex } from '@metamask/utils';

export function useIntentsTargetChainId() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId: targetChainId } = transactionMeta;

  return targetChainId as Hex;
}
