import type { ApprovalController } from '@metamask/approval-controller';
import log from 'loglevel';
import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../shared/constants/app';

export const HYPERLIQUID_DEPOSIT_PROMPT_FLOW_LOADING_TEXT =
  'Preparing Hyperliquid deposit...';

type HyperliquidDepositPromptResult =
  | {
      started: true;
      transactionId: string;
    }
  | {
      started: false;
      suppress?: boolean;
    };

type HyperliquidDepositPromptApprovalController = Pick<
  ApprovalController,
  'addAndShowApprovalRequest' | 'hasRequest'
>;

const suppressedPromptKeys = new Set<string>();

export function isHyperliquidDepositPromptSuppressed({
  origin,
  selectedAddress,
}: {
  origin: string;
  selectedAddress?: string;
}): boolean {
  return suppressedPromptKeys.has(
    getSuppressedPromptKey(origin, selectedAddress),
  );
}

export function clearHyperliquidDepositPromptSuppressions(): void {
  suppressedPromptKeys.clear();
}

export function showHyperliquidDepositPromptApproval({
  approvalController,
  origin,
  selectedAddress,
}: {
  approvalController: HyperliquidDepositPromptApprovalController;
  origin: string;
  selectedAddress?: string;
}): void {
  if (isHyperliquidDepositPromptSuppressed({ origin, selectedAddress })) {
    return;
  }

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
  )
    .then((result) => {
      if (isManualDepositPromptResult(result)) {
        suppressedPromptKeys.add(
          getSuppressedPromptKey(origin, selectedAddress),
        );
      }
    })
    .catch((error) => {
      log.error(
        'Hyperliquid deposit prompt approval was rejected or failed',
        error,
      );
    });
}

function getSuppressedPromptKey(origin: string, selectedAddress?: string) {
  return `${origin}:${selectedAddress?.toLowerCase() ?? ''}`;
}

function isManualDepositPromptResult(
  result: unknown,
): result is HyperliquidDepositPromptResult & {
  started: false;
  suppress: true;
} {
  return (
    result !== null &&
    typeof result === 'object' &&
    'started' in result &&
    result.started === false &&
    'suppress' in result &&
    result.suppress === true
  );
}
