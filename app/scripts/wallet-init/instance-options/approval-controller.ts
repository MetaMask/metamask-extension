import type { ShowApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import type { WalletOptions } from '@metamask/wallet';

type ApprovalControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['approvalController']
>;

/**
 * Build the extension's `ApprovalController` instance options.
 * `typesExcludedFromRateLimiting` lists the approval types allowed to bypass
 * the per-origin rate limit.
 *
 * @param options - Options bag.
 * @param options.showApprovalRequest - Callback that surfaces a pending
 * approval request to the user.
 * @returns The extension `ApprovalController` instance options.
 */
export function getApprovalControllerInstanceOptions({
  showApprovalRequest,
}: {
  showApprovalRequest?: ShowApprovalRequest;
}): ApprovalControllerInstanceOptions {
  return {
    showApprovalRequest,
    typesExcludedFromRateLimiting: [
      ApprovalType.PersonalSign,
      ApprovalType.EthSignTypedData,
      ApprovalType.Transaction,
      ApprovalType.WatchAsset,
      ApprovalType.EthGetEncryptionPublicKey,
      ApprovalType.EthDecrypt,

      // Allow one flavor of snap_dialog to be queued.
      DIALOG_APPROVAL_TYPES.default,
    ],
  };
}
