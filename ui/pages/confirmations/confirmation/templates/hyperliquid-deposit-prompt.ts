import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

type HyperliquidDepositPromptResult =
  | { action: 'continue'; transactionId: string }
  | { action: 'dismiss' };

type HyperliquidDepositPromptActions = {
  resolvePendingApproval: (
    id: string,
    value: HyperliquidDepositPromptResult,
  ) => void;
};

/**
 * Returns the templated values to be consumed in the confirmation page.
 * Renders the "Fund Hyperliquid with MetaMask" deposit prompt shown after a
 * successful Hyperliquid ApproveAgent ("Enable trading") signature.
 *
 * @param pendingApproval - The pending confirmation object.
 * @param _t - Translation function.
 * @param actions - Object containing safe actions that the template can invoke.
 * @returns An object containing templated values for the confirmation page.
 */
function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  _t: (key: string) => string,
  actions: HyperliquidDepositPromptActions,
) {
  const { requestData } = pendingApproval;
  const { selectedAddress } = requestData;

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
