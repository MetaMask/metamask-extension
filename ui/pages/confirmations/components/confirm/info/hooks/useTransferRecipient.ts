import { useMemo } from 'react';
import {
  TransactionMeta,
  TransactionType,
  NestedTransactionMetadata,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { parseStandardTokenTransactionData } from '../../../../../../../shared/modules/transaction.utils';

export function useTransferRecipient(): string | undefined {
  const { currentConfirmation: transactionMetadata } =
    useConfirmContext<TransactionMeta>();

  return useMemo(() => {
    if (!transactionMetadata) {
      return undefined;
    }

    return getRecipientFromTransactionMetadata(transactionMetadata);
  }, [transactionMetadata]);
}

export function useNestedTransactionTransferRecipients(): string[] {
  const { currentConfirmation: transactionMetadata } =
    useConfirmContext<TransactionMeta>();

  const { nestedTransactions } = transactionMetadata ?? {};

  return useMemo(() => {
    if (!nestedTransactions?.length) {
      return [];
    }

    return nestedTransactions
      .map(getRecipientFromNestedTransactionMetadata)
      .filter((recipient): recipient is string => recipient !== undefined);
  }, [nestedTransactions]);
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

function getTransactionDataRecipient(data: string): string | undefined {
  const transactionData = parseStandardTokenTransactionData(data);

  const transferTo = transactionData?.args?._to || transactionData?.args?.to;

  return transferTo;
}
