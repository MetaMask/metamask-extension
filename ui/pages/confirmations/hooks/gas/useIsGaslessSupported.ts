import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  getIsSmartTransaction,
  type SmartTransactionsState,
} from '../../../../../shared/modules/selectors';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { isAtomicBatchSupported } from '../../../../store/controller-actions/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import {
  isRelaySupported,
  isSendBundleSupported,
} from '../../../../store/actions';

export function useIsGaslessSupported() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId, txParams } = transactionMeta ?? {};
  const { from } = txParams ?? {};

  const isSmartTransaction = useSelector((state: SmartTransactionsState) =>
    getIsSmartTransaction(state, chainId),
  );

  const { value: atomicBatchSupportResult } = useAsyncResult(async () => {
    if (isSmartTransaction) {
      return undefined;
    }

    return isAtomicBatchSupported({
      address: from as Hex,
      chainIds: [chainId],
    });
  }, [chainId, from, isSmartTransaction]);

  const { value: relaySupportsChain } = useAsyncResult(async () => {
    if (isSmartTransaction) {
      return undefined;
    }

    return isRelaySupported(chainId);
  }, [chainId, isSmartTransaction]);

  const { value: sendBundleSupportsChain } = useAsyncResult(async () => {
    return isSendBundleSupported(chainId);
  }, [chainId]);

  const atomicBatchChainSupport = atomicBatchSupportResult?.find(
    (result) => result.chainId.toLowerCase() === chainId.toLowerCase(),
  );

  // Currently requires upgraded account, can also support no `delegationAddress` in future.
  const is7702Supported = Boolean(
    atomicBatchChainSupport?.isSupported && relaySupportsChain,
  );

  const isSupported = Boolean(
    sendBundleSupportsChain && (isSmartTransaction || is7702Supported),
  );

  return {
    isSupported,
    isSmartTransaction,
  };
}
