import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  getIsSmartTransaction,
  SmartTransactionsState,
} from '../../../../../shared/modules/selectors';
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
    isSupported: Boolean(isSmartTransaction && sendBundleSupported),
    pending,
  };
}
