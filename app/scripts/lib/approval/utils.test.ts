import {
  ApprovalController,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import { ApprovalType } from '@metamask/controller-utils';
import { providerErrors } from '@metamask/rpc-errors';
import {
  getAttentionRequiredApprovalCount,
  rejectOriginApprovals,
} from './utils';

const ID_MOCK = '123';
const ID_MOCK_2 = '456';
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
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
  } as unknown as jest.Mocked<ApprovalController>;
}

describe('Approval Utils', () => {
  describe('getAttentionRequiredApprovalCount', () => {
    it('returns the total number of pending approvals', () => {
      const approvalController = createApprovalControllerMock([
        { id: ID_MOCK, type: ApprovalType.Transaction },
        { id: ID_MOCK_2, type: ApprovalType.PersonalSign },
      ]);

      expect(
        getAttentionRequiredApprovalCount({
          approvalController,
        }),
      ).toBe(2);
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

      expect(approvalController.rejectRequest).toHaveBeenCalledTimes(1);
      expect(approvalController.rejectRequest).toHaveBeenCalledWith(
        ID_MOCK,
        providerErrors.userRejectedRequest(REJECT_ALL_APPROVALS_DATA),
      );
    });
  });
});
