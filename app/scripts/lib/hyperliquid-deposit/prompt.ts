import type { ApprovalController } from '@metamask/approval-controller';
import log from 'loglevel';
import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../../shared/constants/app';

type HyperliquidDepositPromptApprovalController = Pick<
  ApprovalController,
  'add' | 'addAndShowApprovalRequest' | 'hasRequest' | 'state'
>;

type ShowHyperliquidDepositPromptApprovalOptions = {
  approvalController: HyperliquidDepositPromptApprovalController;
  origin: string;
  selectedAddress?: string;
  tabId?: number;
  // Optional function to open the popup. If provided and returns true, the
  // approval is added without triggering UI (the popup will show it).
  requestOpenPopup?: (tabId: number) => Promise<boolean>;
  closeNotification?: () => Promise<void>;
};

/**
 * Adds and shows the Hyperliquid deposit prompt approval unless one is
 * already pending for this origin.
 *
 * @param options - The prompt options.
 * @param options.approvalController - The approval controller instance.
 * @param options.origin - The origin of the signature request.
 * @param options.selectedAddress - The address that signed the request.
 * @param options.tabId - The tab ID of the dapp that triggered the approval.
 * @param options.requestOpenPopup - Optional function to open popup.
 * @param options.closeNotification - Optional function to close notification.
 */
export async function showHyperliquidDepositPromptApproval({
  approvalController,
  origin,
  selectedAddress,
  tabId,
  requestOpenPopup,
  closeNotification,
}: ShowHyperliquidDepositPromptApprovalOptions): Promise<void> {
  if (
    approvalController.hasRequest({
      origin,
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    })
  ) {
    return;
  }

  const approvalRequest = {
    origin,
    requestData: {
      selectedAddress: selectedAddress ?? '',
    },
    type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
  };

  const pendingApprovalCount = Object.keys(
    approvalController.state.pendingApprovals,
  ).length;

  // If requestOpenPopup is provided, we have a tabId, and there are no other pending
  // approvals, try to open popup. (If there are other pending approvals, they will show
  // first in popup, not our deposit prompt.) On success, close notification and add prompt.
  if (requestOpenPopup && tabId !== undefined && pendingApprovalCount === 0) {
    try {
      const popupOpened = await requestOpenPopup(tabId);
      if (popupOpened) {
        await closeNotification?.();
        approvalController.add(approvalRequest).catch(() => {
          // User dismissed or approval failed - both are expected flows
        });
        return;
      }
    } catch (error) {
      log.debug(
        'HyperliquidDepositPrompt: Failed to open popup, falling back to default UI',
        error,
      );
    }
  }

  // Default: let triggerUi decide (notification/sidepanel)
  approvalController.addAndShowApprovalRequest(approvalRequest).catch(() => {
    // User dismissed or approval failed - both are expected flows
  });
}
