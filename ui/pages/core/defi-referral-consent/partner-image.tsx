import React from 'react';

/**
 * Partner referral hero images are loaded dynamically via partnerId — do not
 * remove these assets from app/images/:
 *
 * - app/images/hyperliquid-referral.png
 * - app/images/gmx-referral.png
 * - app/images/asterdex-referral.png
 * - app/images/variational-referral.png
 */
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
  return (
    <img
      className={className}
      src={`./images/${partnerId}-referral.png`}
      alt={`${partnerName} referral`}
    />
  );
};
