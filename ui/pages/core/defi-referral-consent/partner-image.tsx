import React from 'react';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../../shared/constants/defi-referrals';

type PartnerImageProps = {
  partnerId: string;
  partnerName: string;
  className?: string;
};

export const PartnerImage: React.FC<PartnerImageProps> = ({
  partnerId,
  partnerName,
  className,
}) => {
  const { referralImageUrl } =
    DEFI_REFERRAL_PARTNERS[partnerId as DefiReferralPartner];

  return (
    <img
      className={className}
      src={referralImageUrl}
      alt={`${partnerName} referral`}
    />
  );
};
