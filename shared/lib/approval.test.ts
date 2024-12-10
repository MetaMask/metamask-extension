import {
  ApprovalController,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { ApprovalType } from '@metamask/controller-utils';
import { providerErrors } from '@metamask/rpc-errors';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../constants/app';
import { rejectAllApprovals } from './approval';

const ID_MOCK = '123';
const ID_MOCK_2 = '456';

function createApprovalControllerMock(
  pendingApprovals: Partial<ApprovalRequest<Record<string, Json>>>[],
) {
  return {
    state: {
      pendingApprovals,
    },
    accept: jest.fn(),
    reject: jest.fn(),
  } as unknown as jest.Mocked<ApprovalController>;
}

describe('Approval Utils', () => {
  describe('rejectAllApprovals', () => {
    it('rejects approval requests with rejected error', () => {
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, type: ApprovalType.Transaction },
        { id: ID_MOCK_2, type: ApprovalType.EthSignTypedData },
      ]);

      rejectAllApprovals(approvalController);

      expect(approvalController.reject).toHaveBeenCalledTimes(2);
      expect(approvalController.reject).toHaveBeenCalledWith(
        ID_MOCK,
        providerErrors.userRejectedRequest(),
      );
      expect(approvalController.reject).toHaveBeenCalledWith(
        ID_MOCK_2,
        providerErrors.userRejectedRequest(),
      );
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ApprovalType.SnapDialogAlert,
      ApprovalType.SnapDialogPrompt,
      DIALOG_APPROVAL_TYPES.default,
    ])('accepts pending approval if type is %s', (type: string) => {
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, type },
      ]);

      rejectAllApprovals(approvalController);

      expect(approvalController.accept).toHaveBeenCalledTimes(1);
      expect(approvalController.accept).toHaveBeenCalledWith(ID_MOCK, null);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ApprovalType.SnapDialogConfirmation,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ])('accepts pending approval if type is %s', () => {
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, type: ApprovalType.SnapDialogConfirmation },
      ]);

      rejectAllApprovals(approvalController);

      expect(approvalController.accept).toHaveBeenCalledTimes(1);
      expect(approvalController.accept).toHaveBeenCalledWith(ID_MOCK, false);
    });
  });
});
