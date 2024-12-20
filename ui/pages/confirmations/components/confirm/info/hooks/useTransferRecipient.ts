import { TransactionMeta } from '@metamask/transaction-controller';
import { useTokenTransactionData } from './useTokenTransactionData';
import { useConfirmContext } from '../../../../context/confirm';

export function useTransferRecipient() {
  const { currentConfirmation: transactionMetadata } =
    useConfirmContext<TransactionMeta>();

  const transactionData = useTokenTransactionData();
  const transactionTo = transactionMetadata?.txParams?.to;
  const transferTo = transactionData?.args?._to as string | undefined;

  return transferTo || transactionTo;
}
