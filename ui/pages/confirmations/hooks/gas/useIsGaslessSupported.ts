import { TransactionMeta } from '@metamask/transaction-controller';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useConfirmContext } from '../../context/confirm';
import { isRelaySupported } from '../../../../store/actions';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';

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
 * - `pending`: `true` if the support check is still in progress.
 */
export function useIsGaslessSupported() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta ?? {};

  const {
    isSmartTransaction,
    isSupported: isSmartTransactionAndBundleSupported,
    pending: smartTransactionPending,
  } = useGaslessSupportedSmartTransactions();

  const shouldCheck7702Eligibility =
    !smartTransactionPending && !isSmartTransactionAndBundleSupported;
  const { value: relaySupportsChain, pending: relayPending } =
    useAsyncResult(async () => {
      if (!shouldCheck7702Eligibility) {
        return undefined;
      }

      return isRelaySupported(chainId);
    }, [chainId, shouldCheck7702Eligibility]);

  const is7702Supported = Boolean(
    relaySupportsChain &&
      // contract deployments can't be delegated
      transactionMeta?.txParams?.to !== undefined,
  );

  const isSupported = Boolean(
    isSmartTransactionAndBundleSupported || is7702Supported,
  );

  const isPending =
    smartTransactionPending || (shouldCheck7702Eligibility && relayPending);

  return {
    isSupported,
    isSmartTransaction,
    pending: isPending,
  };
}
