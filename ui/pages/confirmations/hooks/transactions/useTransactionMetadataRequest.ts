import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import {
  TransactionState,
  selectUnapprovedTransactionById,
} from '../../../../selectors/transactionController';
import { useConfirmationId } from '../useConfirmationId';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

const FALLBACK_TRANSACTION_META: TransactionMeta = {
  id: '',
  chainId: '0x0',
  networkClientId: '',
  status: TransactionStatus.rejected,
  time: 0,
  txParams: {
    from: EMPTY_ADDRESS,
  },
  type: TransactionType.simpleSend,
};

export function useTransactionMetadataRequestOptional():
  | TransactionMeta
  | undefined {
  const confirmationId = useConfirmationId();

  return useSelector((state) =>
    selectUnapprovedTransactionById(state as TransactionState, confirmationId),
  );
}

export function useTransactionMetadataRequest(): TransactionMeta {
  return useTransactionMetadataRequestOptional() ?? FALLBACK_TRANSACTION_META;
}
