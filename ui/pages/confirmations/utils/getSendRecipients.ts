import {
  NestedTransactionMetadata,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { getTransactionDataRecipient } from '../../../../shared/lib/transaction.utils';

const TOKEN_TRANSFER_TYPES = new Set([
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
]);

type SendRecipientSource = {
  data?: string;
  swapAndSendRecipient?: string;
  to?: string;
  type?: TransactionType;
};

/**
 * Returns user-chosen send payees for a transaction.
 *
 * Address poisoning should only compare against addresses the user actually
 * sent to. Protocol addresses (token, Permit2, router, spender) are
 * dapp-supplied and must not be treated as payees.
 *
 * Keep this aligned with `getSendRecipients` in `@metamask/transaction-controller`
 * until clients consume a published version of that helper.
 *
 * @param transactionMeta - Transaction meta with txParams and type.
 * @returns Deduplicated send recipient addresses, possibly empty.
 */
export function getSendRecipients(transactionMeta: TransactionMeta): string[] {
  const params = transactionMeta.txParamsOriginal ?? transactionMeta.txParams;
  const recipients: string[] = [];
  const seen = new Set<string>();

  const addRecipient = (address?: string) => {
    const normalized = address?.toLowerCase();
    if (!address || !normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    recipients.push(address);
  };

  addRecipient(
    getSendRecipientFromSource({
      data: params?.data,
      swapAndSendRecipient: transactionMeta.swapAndSendRecipient,
      to: params?.to,
      type: transactionMeta.type,
    }),
  );
  addRecipient(transactionMeta.swapAndSendRecipient);

  for (const nestedTransaction of transactionMeta.nestedTransactions ?? []) {
    addRecipient(getSendRecipientFromNestedTransaction(nestedTransaction));
  }

  return recipients;
}

function getSendRecipientFromNestedTransaction(
  nestedTransaction: NestedTransactionMetadata,
): string | undefined {
  return getSendRecipientFromSource({
    data: nestedTransaction.data,
    to: nestedTransaction.to,
    type: nestedTransaction.type,
  });
}

function getSendRecipientFromSource({
  data,
  swapAndSendRecipient,
  to,
  type,
}: SendRecipientSource): string | undefined {
  if (type === TransactionType.swapAndSend) {
    return swapAndSendRecipient;
  }

  if (isNativeSendType(type, data)) {
    return to;
  }

  if (type && TOKEN_TRANSFER_TYPES.has(type) && hasCalldata(data)) {
    return getTransactionDataRecipient(data);
  }

  return undefined;
}

function isNativeSendType(
  type: TransactionType | undefined,
  data?: string,
): boolean {
  return (
    type === TransactionType.simpleSend ||
    (type === undefined && !hasCalldata(data))
  );
}

function hasCalldata(data?: string): data is string {
  return Boolean(data && data !== '0x');
}
