import type { ApprovalController } from '@metamask/approval-controller';
import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../../shared/constants/app';

type HyperliquidDepositPromptApprovalController = Pick<
  ApprovalController,
  'addAndShowApprovalRequest' | 'hasRequest'
>;

/**
 * Adds and shows the Hyperliquid deposit prompt approval unless one is
 * already pending for this origin.
 *
 * @param options - The prompt options.
 * @param options.approvalController - The approval controller instance.
 * @param options.origin - The origin of the signature request.
 * @param options.selectedAddress - The address that signed the request.
 */
export function showHyperliquidDepositPromptApproval({
  approvalController,
  origin,
  selectedAddress,
}: {
  approvalController: HyperliquidDepositPromptApprovalController;
  origin: string;
  selectedAddress?: string;
}): void {
  if (
    approvalController.hasRequest({
      origin,
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    })
  ) {
    return;
  }

  approvalController
    .addAndShowApprovalRequest({
      origin,
      requestData: {
        selectedAddress: selectedAddress ?? '',
      },
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    })
    .catch(() => {
      // User dismissed or approval failed - both are expected flows
    });
}
