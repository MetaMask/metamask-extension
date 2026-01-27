import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

type HyperliquidReferralConsentActions = {
  resolvePendingApproval: (
    id: string,
    value: {
      approved: boolean;
      selectedAddress: string;
    },
  ) => void;
};

type HyperliquidReferralConsentResult = {
  approved: boolean;
  selectedAddress: string;
};

/**
 * Returns the templated values to be consumed in the confirmation page.
 *
 * @param pendingApproval - The pending confirmation object.
 * @param _t - Translation function.
 * @param actions - Object containing safe actions that the template can invoke.
 * @returns An object containing templated values for the confirmation page.
 */
function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  _t: (key: string) => string,
  actions: HyperliquidReferralConsentActions,
) {
  const { requestData } = pendingApproval;
  const { selectedAddress } = requestData;

  const onActionComplete = (result: HyperliquidReferralConsentResult) => {
    actions.resolvePendingApproval(pendingApproval.id, {
      approved: result.approved,
      selectedAddress: result.selectedAddress,
    });
  };

  return {
    content: [
      {
        element: 'HyperliquidReferralConsent',
        key: 'hyperliquid-referral-consent',
        props: {
          onActionComplete,
          selectedAddress,
        },
      },
    ],
    hideSubmitButton: true,
  };
}

const hyperliquidReferralConsent = {
  getValues,
};

export default hyperliquidReferralConsent;
