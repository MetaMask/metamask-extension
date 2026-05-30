import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import type { HyperliquidDepositPromptResult } from '../../../core/hyperliquid-deposit-prompt';

type HyperliquidDepositPromptActions = {
  resolvePendingApproval: (
    id: string,
    value: HyperliquidDepositPromptResult,
  ) => void;
};

function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  _t: (key: string) => string,
  actions: HyperliquidDepositPromptActions,
) {
  const selectedAddress =
    typeof pendingApproval.requestData?.selectedAddress === 'string'
      ? pendingApproval.requestData.selectedAddress
      : undefined;

  const onActionComplete = (result: HyperliquidDepositPromptResult) => {
    actions.resolvePendingApproval(pendingApproval.id, result);
  };

  return {
    content: [
      {
        element: 'HyperliquidDepositPrompt',
        key: 'hyperliquid-deposit-prompt',
        props: {
          onActionComplete,
          selectedAddress,
        },
      },
    ],
    hideSubmitButton: true,
  };
}

const hyperliquidDepositPrompt = {
  getValues,
};

export default hyperliquidDepositPrompt;
