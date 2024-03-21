import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';

import { isSignatureApprovalRequest } from './confirm';

describe('confirm util', () => {
  describe('isSignatureApprovalRequest', () => {
    it('returns true for signature approval requests', () => {
      const result = isSignatureApprovalRequest({
        type: ApprovalType.PersonalSign,
      } as ApprovalRequest<any>);
      expect(result).toStrictEqual(true);
    });
    it('returns false for request not of type signature', () => {
      const result = isSignatureApprovalRequest({
        type: ApprovalType.Transaction,
      } as ApprovalRequest<any>);
      expect(result).toStrictEqual(false);
    });
  });
});
