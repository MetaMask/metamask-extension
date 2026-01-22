import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  ApprovalsMetaMaskState,
  selectPendingApproval,
} from '../../../selectors';
import { useConfirmContext } from '../context/confirm';

/**
 * Returns the pending approval request for the current confirmation.
 *
 * @returns The pending approval request or undefined if not found.
 */
export function useApprovalRequest():
  | ApprovalRequest<Record<string, Json>>
  | undefined {
  const { currentConfirmation } = useConfirmContext();

  const approvalRequest = useSelector((state) =>
    selectPendingApproval(
      state as ApprovalsMetaMaskState,
      currentConfirmation?.id,
    ),
  );

  return approvalRequest;
}
