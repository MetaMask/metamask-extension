import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

type HyperliquidReferralConsentActions = {
  resolvePendingApproval: (id: string, value: {
    approved: boolean;
    allAccounts: boolean;
    selectedAddress: string;
  }) => void;
};

type HyperliquidReferralConsentResult = {
  approved: boolean;
  allAccounts: boolean;
  selectedAddress: string;
};

/**
 * Returns the templated values to be consumed in the confirmation page.
 *
 * @param pendingApproval - The pending confirmation object.
 * @param t - Translation function.
 * @param actions - Object containing safe actions that the template can invoke.
 * @returns An object containing templated values for the confirmation page.
 */
function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  t: (key: string) => string,
  actions: HyperliquidReferralConsentActions,
) {
  const { requestData } = pendingApproval;
  const { allAccounts, selectedAddress } = requestData;

  const onActionComplete = (result: HyperliquidReferralConsentResult) => {
    actions.resolvePendingApproval(pendingApproval.id, {
      approved: result.approved,
      allAccounts: result.allAccounts,
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
          allAccounts,
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
