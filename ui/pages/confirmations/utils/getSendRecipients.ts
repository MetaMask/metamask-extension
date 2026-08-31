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
 * - Speed-up transactions (`type: retry`) classified using `originalType`, since `txParams` are otherwise unchanged from the transaction being sped up. Cancellations (`type: cancel`) are not resolved this way, since `to`/`data` are overwritten into a self-send with no real payee to track.
 * - A native transfer with no calldata to an address that happens to be a contract. `determineTransactionType` only returns `simpleSend` when `to` is not a contract, so these are typed `contractInteraction` even though the user chose that address as a plain payee.
 *
 * This duplicates `getSendRecipients` from `@metamask/transaction-controller`.
 * That helper is not published yet; it lands with
 * https://github.com/MetaMask/core/pull/9943. Delete this file and import from
 * the package once a release containing it is pinned here. Until then, changes
 * here need the same change there.
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
      type: getEffectiveType(
        transactionMeta.type,
        transactionMeta.originalType,
      ),
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
  if (type === TransactionType.simpleSend) {
    return true;
  }

  return (
    !hasCalldata(data) &&
    (type === undefined || type === TransactionType.contractInteraction)
  );
}

/**
 * Resolves the type used to classify a transaction as a send.
 *
 * Speed-up transactions keep the original `txParams`, so they should be
 * classified by what they originally were, not by `retry`. Cancellations
 * overwrite `to`/`data` into a self-send, so `originalType` would misclassify
 * them; `type` is returned unchanged instead.
 *
 * @param type - The transaction's own type.
 * @param originalType - The type before a speed-up replaced it, if any.
 * @returns The type to use when classifying the transaction as a send.
 */
function getEffectiveType(
  type: TransactionType | undefined,
  originalType: TransactionType | undefined,
): TransactionType | undefined {
  if (type === TransactionType.retry && originalType) {
    return originalType;
  }

  return type;
}

function hasCalldata(data?: string): data is string {
  return Boolean(data && data !== '0x');
}
