import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { firstPendingConfirmationSelector } from '../selectors/confirm';

/**
 * Resolves the current confirmation ID from URL params or the oldest pending
 * confirmation. This hook centralises the ID resolution logic used by all
 * confirmation data hooks (transaction metadata, signature requests, etc.).
 *
 * @returns The resolved confirmation ID, or `undefined` when none is available.
 */
export function useConfirmationId(): string | undefined {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(firstPendingConfirmationSelector);

  return paramsConfirmationId ?? oldestPendingApproval?.id;
}
