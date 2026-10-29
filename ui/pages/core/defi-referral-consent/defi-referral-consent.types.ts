export type DefiReferralConsentProps = {
  onActionComplete: (result: {
    approved: boolean;
    selectedAddress: string;
  }) => void;
  selectedAddress: string;
  partnerId: string;
  partnerName: string;
  learnMoreUrl: string;
};
