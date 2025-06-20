import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { useTokenTransactionData } from './useTokenTransactionData';

export function useTransferRecipient() {
  const { currentConfirmation: transactionMetadata } =
    useConfirmContext<TransactionMeta>();

  const transactionData = useTokenTransactionData();
  const transactionType = transactionMetadata?.type;
  const transactionTo = transactionMetadata?.txParams?.to;
  const transferTo =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (transactionData?.args?._to as string | undefined) ||
    transactionData?.args?.to;

  return transactionType === TransactionType.simpleSend
    ? transactionTo
    : transferTo;
}
