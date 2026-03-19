import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { getUnapprovedTransaction } from '../../../selectors';
import { useConfirmationId } from './useConfirmationId';

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

  const transactionMetadata = useSelector((state) =>
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getUnapprovedTransaction as any)(state, confirmationId),
  ) as TransactionMeta | undefined;

  return transactionMetadata;
}

export function useTransactionMetadataRequest(): TransactionMeta {
  return useTransactionMetadataRequestOptional() ?? FALLBACK_TRANSACTION_META;
}
