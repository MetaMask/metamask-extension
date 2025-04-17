import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getIsSmartTransaction } from '../../../../../shared/modules/selectors';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { isAtomicBatchSupported } from '../../../../store/controller-actions/transaction-controller';
import { useConfirmContext } from '../../context/confirm';

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

  const supportsGaslessBundle = isSmartTransaction;

  const supportsGasless7702 =
    process.env.TRANSACTION_RELAY_API_URL &&
    Boolean(atomicBatchChainSupport) &&
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (atomicBatchChainSupport?.isSupported ||
      !atomicBatchChainSupport?.delegationAddress);

  return supportsGaslessBundle || supportsGasless7702;
}
