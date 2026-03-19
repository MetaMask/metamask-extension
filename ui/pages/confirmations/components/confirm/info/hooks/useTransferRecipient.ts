import {
  TransactionMeta,
  TransactionType,
  NestedTransactionMetadata,
} from '@metamask/transaction-controller';
import { useTransactionMetadataRequest } from '../../../../hooks/useTransactionMetadataRequest';
import { getTransactionDataRecipient } from '../../../../../../../shared/lib/transaction.utils';

export function useTransferRecipient(): string | undefined {
  const transactionMetadata = useTransactionMetadataRequest();

  if (!transactionMetadata) {
    return undefined;
  }

  return getRecipientFromTransactionMetadata(transactionMetadata);
}

export function useNestedTransactionTransferRecipients(): string[] {
  const transactionMetadata = useTransactionMetadataRequest();

  if (!transactionMetadata?.nestedTransactions?.length) {
    return [];
  }

  return transactionMetadata.nestedTransactions
    .map(getRecipientFromNestedTransactionMetadata)
    .filter((recipient): recipient is string => recipient !== undefined);
}

function getRecipientFromNestedTransactionMetadata(
  nestedTransactionMetadata: NestedTransactionMetadata,
): string | undefined {
  const { type, data, to } = nestedTransactionMetadata;
  return getRecipientByType(type as TransactionType, data ?? '', to ?? '');
}

function getRecipientFromTransactionMetadata(
  transactionMetadata: TransactionMeta,
): string | undefined {
  const { type, txParams } = transactionMetadata;
  return getRecipientByType(
    type as TransactionType,
    txParams?.data ?? '',
    txParams?.to ?? '',
  );
}

function getRecipientByType(
  type: TransactionType,
  data: string,
  transactionTo: string,
): string | undefined {
  const dataRecipient = getTransactionDataRecipient(data);
  const paramsRecipient = transactionTo;

  if (type === TransactionType.simpleSend) {
    return paramsRecipient;
  }

  return dataRecipient || paramsRecipient;
}
