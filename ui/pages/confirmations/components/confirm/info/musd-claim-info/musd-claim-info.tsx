import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../context/confirm';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { NetworkRow } from '../shared/network-row/network-row';
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
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  return (
    <>
      <MusdClaimHeading />
      <ConfirmInfoSection data-testid="musd-claim-details-section">
        <ConfirmInfoRow label={t('musdClaimClaimingTo')}>
          <ConfirmInfoRowAddress
            address={transactionMeta.txParams.from}
            chainId={transactionMeta.chainId}
          />
        </ConfirmInfoRow>
        <NetworkRow />
      </ConfirmInfoSection>
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};
