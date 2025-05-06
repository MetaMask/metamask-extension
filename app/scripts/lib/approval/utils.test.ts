import {
  ApprovalController,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { ApprovalType } from '@metamask/controller-utils';
import { providerErrors } from '@metamask/rpc-errors';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { rejectAllApprovals, rejectOriginApprovals } from './utils';

const ID_MOCK = '123';
const ID_MOCK_2 = '456';
const INTERFACE_ID_MOCK = '789';
const REJECT_ALL_APPROVALS_DATA = {
  data: {
    cause: 'rejectAllApprovals',
  },
};

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

      rejectAllApprovals({
        approvalController,
      });

      expect(approvalController.reject).toHaveBeenCalledTimes(2);
      expect(approvalController.reject).toHaveBeenCalledWith(
        ID_MOCK,
        providerErrors.userRejectedRequest(REJECT_ALL_APPROVALS_DATA),
      );
      expect(approvalController.reject).toHaveBeenCalledWith(
        ID_MOCK_2,
        providerErrors.userRejectedRequest(REJECT_ALL_APPROVALS_DATA),
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

      rejectAllApprovals({ approvalController });

      expect(approvalController.accept).toHaveBeenCalledTimes(1);
      expect(approvalController.accept).toHaveBeenCalledWith(ID_MOCK, null);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ApprovalType.SnapDialogConfirmation,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ])('accepts pending approval if type is %s', (type: string) => {
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, type },
      ]);

      rejectAllApprovals({ approvalController });

      expect(approvalController.accept).toHaveBeenCalledTimes(1);
      expect(approvalController.accept).toHaveBeenCalledWith(ID_MOCK, false);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ApprovalType.SnapDialogAlert,
      ApprovalType.SnapDialogPrompt,
      DIALOG_APPROVAL_TYPES.default,
      ApprovalType.SnapDialogConfirmation,
    ])('deletes interface if type is %s', (type: string) => {
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, type, requestData: { id: INTERFACE_ID_MOCK } },
      ]);

      const deleteInterface = jest.fn();

      rejectAllApprovals({ approvalController, deleteInterface });

      expect(deleteInterface).toHaveBeenCalledTimes(1);
      expect(deleteInterface).toHaveBeenCalledWith(INTERFACE_ID_MOCK);
    });
  });

  describe('rejectOriginApprovals', () => {
    it('rejects approval requests from given origin', () => {
      const origin = 'https://example.com';
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, origin, type: ApprovalType.Transaction },
        {
          id: ID_MOCK_2,
          origin: 'www.test.com',
          type: ApprovalType.EthSignTypedData,
        },
      ]);

      rejectOriginApprovals({
        approvalController,
        deleteInterface: () => undefined,
        origin,
      });

      expect(approvalController.reject).toHaveBeenCalledTimes(1);
      expect(approvalController.reject).toHaveBeenCalledWith(
        ID_MOCK,
        providerErrors.userRejectedRequest(REJECT_ALL_APPROVALS_DATA),
      );
    });
  });
});
