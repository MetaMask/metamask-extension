import type { ApprovalController } from '@metamask/approval-controller';
import log from 'loglevel';
import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../shared/constants/app';

export const HYPERLIQUID_DEPOSIT_PROMPT_FLOW_LOADING_TEXT =
  'Preparing Hyperliquid deposit...';

type HyperliquidDepositPromptApprovalController = Pick<
  ApprovalController,
  'addAndShowApprovalRequest' | 'hasRequest'
>;

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

  Promise.resolve(
    approvalController.addAndShowApprovalRequest({
      origin,
      requestData: {
        selectedAddress: selectedAddress ?? '',
      },
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    }),
  ).catch((error) => {
    log.error(
      'Hyperliquid deposit prompt approval was rejected or failed',
      error,
    );
  });
}
