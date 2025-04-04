import { useSelector } from 'react-redux';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { useAsyncResult } from '../../../hooks/useAsync';
import { isAtomicBatchSupported } from '../../../store/controller-actions/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

export function useIsGaslessSupported() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const isSmartTransaction = useSelector(getIsSmartTransaction);

  const { chainId, txParams } = transactionMeta;
  const { from } = txParams;

  const { value: atomicBatchSupportResult } = useAsyncResult(
    async () =>
      isAtomicBatchSupported({
        address: from as Hex,
        chainIds: [chainId],
      }),
    [chainId, from],
  );

  const atomicBatchChainSupport = atomicBatchSupportResult?.find(
    (result) => result.chainId.toLowerCase() === chainId.toLowerCase(),
  );

  return (
    isSmartTransaction ||
    (atomicBatchChainSupport &&
      (atomicBatchChainSupport.isSupported ||
        !atomicBatchChainSupport.delegationAddress))
  );
}
