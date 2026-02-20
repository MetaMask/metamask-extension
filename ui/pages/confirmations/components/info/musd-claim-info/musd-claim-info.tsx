import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { GasFeesSection } from '../../confirm/info/shared/gas-fees-section/gas-fees-section';
import { AdvancedDetails } from '../../confirm/info/shared/advanced-details/advanced-details';
import { NetworkRow } from '../../confirm/info/shared/network-row/network-row';
import { AccountRow } from '../../rows/account-row';
import MusdClaimHeading from './musd-claim-heading';

/**
 * Info component for mUSD claim (Merkl rewards) confirmation screen.
 *
 * Layout (matching mobile):
 * 1. Hero row - mUSD avatar + claim amount + fiat value
 * 2. Info section:
 * - "Claiming to" row with the user's account address
 * - Network row (Linea)
 * 3. Gas fees section
 * 4. Advanced details (nonce, tx data - shown when toggled)
 */
export const MusdClaimInfo = () => {
  const t = useI18nContext();

  return (
    <>
      <MusdClaimHeading />
      <ConfirmInfoSection data-testid="musd-claim-details-section">
        <AccountRow label={t('musdClaimClaimingTo')} />
        <NetworkRow />
      </ConfirmInfoSection>
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};
