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

/**
 * Hook to determine if gasless transactions are supported for the current confirmation context.
 *
 * Gasless support can be enabled in two ways:
 * - Via 7702: Supported when the current account is upgraded, the chain supports atomic batch, relay is available, and the transaction is not a contract deployment.
 * - Via Smart Transactions: Supported when smart transactions are enabled and sendBundle is supported for the chain.
 *
 * @returns An object containing:
 * - `isSupported`: `true` if gasless transactions are supported via either 7702 or smart transactions with sendBundle.
 * - `isSmartTransaction`: `true` if smart transactions are enabled for the current chain.
 */
export function useIsGaslessSupported() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId, txParams } = transactionMeta ?? {};
  const { from } = txParams ?? {};

  const isSmartTransaction = useSelector((state: SmartTransactionsState) =>
    getIsSmartTransaction(state, chainId),
  );

  const { value: sendBundleSupportsChain } = useAsyncResult(async () => {
    return isSendBundleSupported(chainId);
  }, [chainId]);

  const isSmartTransactionsSupported = Boolean(
    isSmartTransaction && sendBundleSupportsChain,
  );

  const { value: atomicBatchSupportResult } = useAsyncResult(async () => {
    if (isSmartTransactionsSupported) {
      return undefined;
    }

    return isAtomicBatchSupported({
      address: from as Hex,
      chainIds: [chainId],
    });
  }, [chainId, from, isSmartTransactionsSupported]);

  const { value: relaySupportsChain } = useAsyncResult(async () => {
    if (isSmartTransactionsSupported) {
      return undefined;
    }

    return isRelaySupported(chainId);
  }, [chainId, isSmartTransactionsSupported]);

  const atomicBatchChainSupport = atomicBatchSupportResult?.find(
    (result) => result.chainId.toLowerCase() === chainId.toLowerCase(),
  );

  // Currently requires upgraded account, can also support no `delegationAddress` in future.
  const is7702Supported = Boolean(
    atomicBatchChainSupport?.isSupported &&
      relaySupportsChain &&
      // contract deployments can't be delegated
      transactionMeta?.txParams.to !== undefined,
  );

  const isSupported = Boolean(isSmartTransactionsSupported || is7702Supported);

  return {
    isSupported,
    isSmartTransaction,
  };
}
