import React from 'react';

import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { Expiry } from './expiry';

/**
 * Displays details for the ERC20 token revocation permission.
 * This component is used to display the details of the ERC20 token revocation permission.
 *
 * @param props - The component props
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the ERC20 token revocation permission details
 */
export const Erc20TokenRevocationDetails: React.FC<{
  expiry: number | null;
}> = ({ expiry }) => {
  return (
    <ConfirmInfoSection data-testid="erc20-token-revocation-details-section">
      <Expiry expiry={expiry} />
    </ConfirmInfoSection>
  );
};
