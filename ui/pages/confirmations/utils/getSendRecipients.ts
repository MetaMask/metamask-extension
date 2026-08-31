import {
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
 * Included:
 * - `simpleSend` `to`, preferring `txParamsOriginal` when present
 * - Decoded `to` / `_to` for ERC-20/721/1155 transfer methods
 * - `swapAndSendRecipient` whenever set (only ever a user-entered payee)
 * - Nested batch calls that themselves are sends or token transfers
 * - Untyped transactions with no calldata, treated as legacy native sends
 *
 * This duplicates `getSendRecipients` from `@metamask/transaction-controller`,
 * which is not in the version this repo pins yet. Delete this file and import
 * from the package once the dependency is bumped past core#9943. Until then,
 * changes here need the same change there.
 *
 * @param transactionMeta - Transaction meta with txParams and type.
 * @returns Deduplicated send recipient addresses, possibly empty.
 */
export function getSendRecipients(transactionMeta: TransactionMeta): string[] {
  // Swap the whole params object rather than falling back field by field the
  // way `useTransferRecipient` does. `txParamsOriginal` is a full snapshot of
  // the pre-wrapping params, so its `to` and `data` always describe the same
  // call. Mixing an original `to` with a wrapped `data` would misread an
  // untyped transaction as a contract call and drop a real payee.
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
      to: params?.to,
      type: transactionMeta.type,
    }),
  );
  addRecipient(transactionMeta.swapAndSendRecipient);

  for (const nestedTransaction of transactionMeta.nestedTransactions ?? []) {
    addRecipient(getSendRecipientFromSource(nestedTransaction));
  }

  return recipients;
}

function getSendRecipientFromSource({
  data,
  to,
  type,
}: SendRecipientSource): string | undefined {
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
