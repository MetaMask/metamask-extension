import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  ApprovalsMetaMaskState,
  oldestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';

/**
 * Returns the pending approval request for the current confirmation.
 * Uses URL params or falls back to the oldest pending confirmation.
 *
 * @returns The pending approval request or undefined if not found.
 */
export function useApprovalRequest():
  | ApprovalRequest<Record<string, Json>>
  | undefined {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);

  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;

  const approvalRequest = useSelector((state) =>
    selectPendingApproval(state as ApprovalsMetaMaskState, confirmationId),
  );

  return approvalRequest;
}
