import {
  ApprovalController,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { providerErrors } from '@metamask/rpc-errors';
import { createProjectLogger, Json } from '@metamask/utils';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
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
    rejectApproval({
      approvalController,
      approvalRequest,
      deleteInterface,
    });
  }
}

export function rejectOriginApprovals({
  approvalController,
  deleteInterface,
  origin,
}: {
  approvalController: ApprovalController;
  deleteInterface?: (id: string) => void;
  origin: string;
}) {
  const approvalRequestsById = approvalController.state.pendingApprovals;
  const approvalRequests = Object.values(approvalRequestsById);

  const originApprovalRequests = approvalRequests.filter(
    (approvalRequest) => approvalRequest.origin === origin,
  );

  for (const approvalRequest of originApprovalRequests) {
    rejectApproval({
      approvalController,
      approvalRequest,
      deleteInterface,
    });
  }
}

function rejectApproval({
  approvalController,
  approvalRequest,
  deleteInterface,
}: {
  approvalController: ApprovalController;
  approvalRequest: ApprovalRequest<Record<string, Json>>;
  deleteInterface?: (id: string) => void;
}) {
  const { id, type, origin } = approvalRequest;
  const interfaceId = approvalRequest.requestData?.id as string;

  switch (type) {
    case ApprovalType.SnapDialogAlert:
    case ApprovalType.SnapDialogPrompt:
    case DIALOG_APPROVAL_TYPES.default:
      log('Rejecting snap dialog', { id, interfaceId, origin, type });
      approvalController.accept(id, null);
      deleteInterface?.(interfaceId);
      break;

    case ApprovalType.SnapDialogConfirmation:
      log('Rejecting snap confirmation', { id, interfaceId, origin, type });
      approvalController.accept(id, false);
      deleteInterface?.(interfaceId);
      break;

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation:
    case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval:
    case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect:
      log('Rejecting snap account confirmation', { id, origin, type });
      approvalController.accept(id, false);
      break;
    ///: END:ONLY_INCLUDE_IF

    default:
      log('Rejecting pending approval', { id, origin, type });
      approvalController.reject(
        id,
        providerErrors.userRejectedRequest({
          data: {
            cause: 'rejectAllApprovals',
          },
        }),
      );
      break;
  }
}
