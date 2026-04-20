import React from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { GasFeesSection } from '../../confirm/info/shared/gas-fees-section/gas-fees-section';
import { AdvancedDetails } from '../../confirm/info/shared/advanced-details/advanced-details';
import { NetworkRow } from '../../confirm/info/shared/network-row/network-row';
import { MusdClaimAccountRow } from '../../rows/musd-claim-account-row/musd-claim-account-row';
import MusdClaimHeading from './musd-claim-heading';

/**
 * Info component for mUSD claim (Merkl rewards) confirmation screen.
 *
 * Layout:
 * 1. Heading - "Claim bonus" label, mUSD amount + fiat, token icon on right
 * 2. Account section - "Sending to <Wallet>" with account name + avatar
 * 3. Network row
 * 4. Gas fees section (with Speed row)
 * 5. Advanced details (nonce, tx data - shown when toggled)
 */
export const MusdClaimInfo = () => {
  return (
    <>
      <MusdClaimHeading />
      <ConfirmInfoSection data-testid="musd-claim-details-section">
        <MusdClaimAccountRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection data-testid="musd-claim-network-section">
        <NetworkRow />
      </ConfirmInfoSection>
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};
