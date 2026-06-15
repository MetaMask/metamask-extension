import {
  TransactionMeta,
  TransactionType,
  NestedTransactionMetadata,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { getTransactionDataRecipient } from '../../../../../../../shared/lib/transaction.utils';

export function useTransferRecipient(): string | undefined {
  const { currentConfirmation: transactionMetadata } =
    useConfirmContext<TransactionMeta>();

  if (!transactionMetadata) {
    return undefined;
  }

  return getRecipientFromTransactionMetadata(transactionMetadata);
}

export function useNestedTransactionTransferRecipients(): string[] {
  const { currentConfirmation: transactionMetadata } =
    useConfirmContext<TransactionMeta>();

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
  const { type, txParams, txParamsOriginal } = transactionMetadata;

  // Prefer the original params when container wrapping (e.g. enforced
  // simulations) has replaced `to`/`data` with the delegation manager
  // address and payload, so the UI keeps showing the user-intended
  // recipient.
  const data = txParamsOriginal?.data ?? txParams?.data ?? '';
  const to = txParamsOriginal?.to ?? txParams?.to ?? '';

  return getRecipientByType(type as TransactionType, data, to);
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
