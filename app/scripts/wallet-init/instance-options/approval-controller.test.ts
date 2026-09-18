import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { getApprovalControllerInstanceOptions } from './approval-controller';

describe('getApprovalControllerInstanceOptions', () => {
  it('passes the showApprovalRequest callback through', () => {
    const showApprovalRequest = jest.fn();

    const options = getApprovalControllerInstanceOptions({
      showApprovalRequest,
    });

    expect(options.showApprovalRequest).toBe(showApprovalRequest);
  });

  it('excludes the expected approval types from rate limiting', () => {
    const options = getApprovalControllerInstanceOptions({});

    expect(options.typesExcludedFromRateLimiting).toStrictEqual([
      ApprovalType.PersonalSign,
      ApprovalType.EthSignTypedData,
      ApprovalType.Transaction,
      ApprovalType.WatchAsset,
      ApprovalType.EthGetEncryptionPublicKey,
      ApprovalType.EthDecrypt,
      DIALOG_APPROVAL_TYPES.default,
    ]);
  });
});
