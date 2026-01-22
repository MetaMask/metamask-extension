import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  getUnapprovedTransaction,
  oldestPendingConfirmationSelector,
} from '../../../selectors';

/**
 * Returns the unapproved transaction for the current confirmation.
 * Uses URL params or falls back to the oldest pending confirmation.
 *
 * @returns The unapproved transaction or undefined.
 */
export function useUnapprovedTransaction(): TransactionMeta | undefined {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);

  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;

  const transactionMetadata = useSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getUnapprovedTransaction as any)(state, confirmationId),
  ) as TransactionMeta | undefined;

  return transactionMetadata;
}
