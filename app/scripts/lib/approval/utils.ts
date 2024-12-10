import { ApprovalController } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { providerErrors } from '@metamask/rpc-errors';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { createProjectLogger } from '@metamask/utils';
///: END:ONLY_INCLUDE_IF

const log = createProjectLogger('approval-utils');

export function rejectAllApprovals({
  approvalController,
  deleteInterface,
}: {
  approvalController: ApprovalController;
  deleteInterface?: (id: string) => void;
}) {
  const approvalRequestsById = approvalController.state.pendingApprovals;
  const approvalRequests = Object.values(approvalRequestsById);

  for (const approvalRequest of approvalRequests) {
    const { id, type } = approvalRequest;
    const interfaceId = approvalRequest.requestData?.id as string;

    switch (type) {
      case ApprovalType.SnapDialogAlert:
      case ApprovalType.SnapDialogPrompt:
      case DIALOG_APPROVAL_TYPES.default:
        log('Rejecting snap dialog', { id, interfaceId });
        approvalController.accept(id, null);
        deleteInterface?.(interfaceId);
        break;

      case ApprovalType.SnapDialogConfirmation:
        log('Rejecting snap confirmation', { id, interfaceId });
        approvalController.accept(id, false);
        deleteInterface?.(interfaceId);
        break;

      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation:
      case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval:
      case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect:
        log('Rejecting snap account confirmation', { id });
        approvalController.accept(id, false);
        break;
      ///: END:ONLY_INCLUDE_IF

      default:
        log('Rejecting pending approval', { id });
        approvalController.reject(id, providerErrors.userRejectedRequest());
        break;
    }
  }
}
