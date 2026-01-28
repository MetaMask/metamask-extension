import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';

type DefiReferralConsentActions = {
  resolvePendingApproval: (
    id: string,
    value: {
      approved: boolean;
      selectedAddress: string;
    },
  ) => void;
};

type DefiReferralConsentResult = {
  approved: boolean;
  selectedAddress: string;
};

/**
 * Returns the templated values to be consumed in the confirmation page.
 * This is a generic template for all DeFi referral partners.
 *
 * @param pendingApproval - The pending confirmation object.
 * @param _t - Translation function.
 * @param actions - Object containing safe actions that the template can invoke.
 * @returns An object containing templated values for the confirmation page.
 */
function getValues(
  pendingApproval: ApprovalRequest<Record<string, Json>>,
  _t: (key: string) => string,
  actions: DefiReferralConsentActions,
) {
  const { requestData } = pendingApproval;
  const { selectedAddress, partnerId, partnerName, learnMoreUrl } = requestData;

  const onActionComplete = (result: DefiReferralConsentResult) => {
    actions.resolvePendingApproval(pendingApproval.id, {
      approved: result.approved,
      selectedAddress: result.selectedAddress,
    });
  };

  return {
    content: [
      {
        element: 'DefiReferralConsent',
        key: 'defi-referral-consent',
        props: {
          onActionComplete,
          selectedAddress,
          partnerId,
          partnerName,
          learnMoreUrl,
        },
      },
    ],
    hideSubmitButton: true,
  };
}

const defiReferralConsent = {
  getValues,
};

export default defiReferralConsent;
