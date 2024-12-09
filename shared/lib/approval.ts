import { ApprovalController } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { providerErrors } from '@metamask/rpc-errors';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../constants/app';

export function rejectAllApprovals(approvalController: ApprovalController) {
  const approvalRequestsById = approvalController.state.pendingApprovals;
  const approvalRequests = Object.values(approvalRequestsById);

  for (const approvalRequest of approvalRequests) {
    const { id, type } = approvalRequest;

    switch (type) {
      case ApprovalType.SnapDialogAlert:
      case ApprovalType.SnapDialogPrompt:
      case DIALOG_APPROVAL_TYPES.default:
        approvalController.accept(id, null);
        break;

      case ApprovalType.SnapDialogConfirmation:
        approvalController.accept(id, false);
        break;

      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation:
      case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval:
      case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect:
        approvalController.accept(id, false);
        break;
      ///: END:ONLY_INCLUDE_IF

      default:
        approvalController.reject(id, providerErrors.userRejectedRequest());
        break;
    }
  }
}
