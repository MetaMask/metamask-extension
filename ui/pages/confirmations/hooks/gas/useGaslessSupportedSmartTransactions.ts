import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  getIsSmartTransaction,
  SmartTransactionsState,
} from '../../../../../shared/lib/selectors';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { isSendBundleSupported } from '../../../../store/actions';
import { useConfirmContext } from '../../context/confirm';

export function useGaslessSupportedSmartTransactions(): {
  isSmartTransaction: boolean;
  isSupported: boolean;
  pending: boolean;
} {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta ?? {};
  const isSmartTransaction = useSelector((state: SmartTransactionsState) =>
    getIsSmartTransaction(state, chainId),
  );

  const { value: sendBundleSupported, pending } = useAsyncResult(
    async () => (chainId ? isSendBundleSupported(chainId as Hex) : false),
    [chainId],
  );

  return {
    isSmartTransaction: Boolean(isSmartTransaction),
    // sendBundle requires only standard EIP-1559 signing, which all account
    // types (including hardware wallets) support. Hardware wallets are only
    // excluded from the EIP-7702 relay path (see useIsGaslessSupported).
    isSupported: Boolean(isSmartTransaction && sendBundleSupported),
    pending,
  };
}
