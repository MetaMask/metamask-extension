import type { ApprovalController } from '@metamask/approval-controller';
import log from 'loglevel';
import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../../shared/constants/app';

type HyperliquidDepositPromptApprovalController = Pick<
  ApprovalController,
  'add' | 'addAndShowApprovalRequest' | 'hasRequest'
>;

type ShowHyperliquidDepositPromptApprovalOptions = {
  approvalController: HyperliquidDepositPromptApprovalController;
  origin: string;
  selectedAddress?: string;
  /**
   * Optional callback to open the popup instead of letting triggerUi decide.
   * If provided and returns true, the approval is added without triggering UI
   * (since the popup will show it). If it returns false or throws, falls back
   * to the standard addAndShowApprovalRequest flow.
   */
  openInPopup?: () => Promise<boolean>;
};

/**
 * Adds and shows the Hyperliquid deposit prompt approval unless one is
 * already pending for this origin.
 *
 * @param options - The prompt options.
 * @param options.approvalController - The approval controller instance.
 * @param options.origin - The origin of the signature request.
 * @param options.selectedAddress - The address that signed the request.
 * @param options.openInPopup - Optional callback to open popup first.
 */
export async function showHyperliquidDepositPromptApproval({
  approvalController,
  origin,
  selectedAddress,
  openInPopup,
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

  // If openInPopup is provided, open popup first then add approval.
  // This ensures the notification is closed BEFORE the approval is added,
  // preventing the notification from showing the deposit prompt.
  if (openInPopup) {
    try {
      const popupOpened = await openInPopup();
      if (popupOpened) {
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
    // Fall through to default behavior if popup failed
  }

  // Default: let triggerUi decide (notification/sidepanel)
  approvalController.addAndShowApprovalRequest(approvalRequest).catch(() => {
    // User dismissed or approval failed - both are expected flows
  });
}
