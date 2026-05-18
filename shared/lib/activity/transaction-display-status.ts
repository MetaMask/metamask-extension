import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../constants/transaction';

export const QUEUED_PSEUDO_STATUS = 'queued';
export const SIGNING_PSEUDO_STATUS = 'signing';

const pendingStatusHash: Partial<
  Record<TransactionStatus, TransactionGroupStatus>
> = {
  [TransactionStatus.submitted]: TransactionGroupStatus.pending,
  [TransactionStatus.approved]: TransactionGroupStatus.pending,
  [TransactionStatus.signed]: TransactionGroupStatus.pending,
};

/**
 * Normalizes a raw transaction status for activity list display and tests.
 * E.g. approved → signing; submitted/signed → pending vs queued by nonce order.
 */
export function getTransactionDisplayStatusKey(
  status: string | undefined,
  isEarliestNonce?: boolean,
): string | undefined {
  if (status === TransactionStatus.approved) {
    return SIGNING_PSEUDO_STATUS;
  }

  if (status && pendingStatusHash[status as TransactionStatus]) {
    return isEarliestNonce
      ? TransactionGroupStatus.pending
      : QUEUED_PSEUDO_STATUS;
  }

  return status;
}

/**
 * Whether the legacy activity list should render a status subtitle for this key.
 * Confirmed/pending (earliest) rows omit the second line; queued, signing, and
 * failure states keep it.
 */
export function shouldShowActivityListStatusSubtitle(
  resolvedStatusKey: string | undefined,
): boolean {
  if (resolvedStatusKey === undefined || resolvedStatusKey === '') {
    return false;
  }

  return (
    resolvedStatusKey === QUEUED_PSEUDO_STATUS ||
    resolvedStatusKey === SIGNING_PSEUDO_STATUS ||
    resolvedStatusKey === TransactionStatus.failed ||
    resolvedStatusKey === TransactionStatus.rejected ||
    resolvedStatusKey === TransactionStatus.dropped ||
    resolvedStatusKey === TransactionGroupStatus.cancelled
  );
}
