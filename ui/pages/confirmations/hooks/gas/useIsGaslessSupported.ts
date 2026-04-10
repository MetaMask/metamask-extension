import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { isHardwareWallet } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { isRelaySupported } from '../../../../store/actions';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';

/**
 * Hook to determine if gasless transactions are supported for the current confirmation context.
 *
 * Gasless support can be enabled in two ways:
 * - Via Smart Transactions (sendBundle): Supported when smart transactions are enabled and
 *   sendBundle is supported for the chain. Works for all account types including hardware wallets,
 *   since only standard EIP-1559 signing is required.
 * - Via 7702 relay: Supported when the current account is upgraded, the chain supports atomic
 *   batch, relay is available, and the transaction is not a contract deployment. Hardware wallets
 *   are excluded from this path because they cannot sign EIP-7702 authorization lists.
 *
 * @returns An object containing:
 * - `isSupported`: `true` if gasless transactions are supported via either sendBundle or 7702.
 * - `isSmartTransaction`: `true` if smart transactions are enabled for the current chain.
 * - `pending`: `true` if the support check is still in progress.
 */
export function useIsGaslessSupported() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta ?? {};
  const isHardwareWalletAccount = useSelector(isHardwareWallet);

  const {
    isSmartTransaction,
    isSupported: isSmartTransactionAndBundleSupported,
    pending: smartTransactionPending,
  } = useGaslessSupportedSmartTransactions();

  const shouldCheck7702Eligibility =
    !isHardwareWalletAccount &&
    !smartTransactionPending &&
    !isSmartTransactionAndBundleSupported;
  const { value: relaySupportsChain, pending: relayPending } =
    useAsyncResult(async () => {
      if (!shouldCheck7702Eligibility) {
        return undefined;
      }

      return isRelaySupported(chainId);
    }, [chainId, shouldCheck7702Eligibility]);

  const is7702Supported = Boolean(
    !isHardwareWalletAccount &&
      relaySupportsChain &&
      // contract deployments can't be delegated
      transactionMeta?.txParams?.to !== undefined,
  );

  // sendBundle is open to all account types; is7702Supported already gates HW wallets
  const isSupported = Boolean(
    isSmartTransactionAndBundleSupported || is7702Supported,
  );

  // sendBundle pending state applies to all account types; 7702 pending stays HW-gated
  const isPending =
    smartTransactionPending ||
    (!isHardwareWalletAccount && shouldCheck7702Eligibility && relayPending);

  return {
    isSupported,
    isSmartTransaction,
    pending: isPending,
  };
}
