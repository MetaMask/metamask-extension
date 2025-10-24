import React from 'react';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { NetworkRow } from '../../shared/network-row/network-row';
import { OriginRow } from '../../shared/transaction-details/transaction-details';
import { SigningInWithRow } from '../../shared/sign-in-with-row/sign-in-with-row';
import { useIsBIP44 } from '../../../../../hooks/useIsBIP44';

export const RevokeDetails = () => {
  const isBIP44 = useIsBIP44();

  return (
    <ConfirmInfoSection>
      <NetworkRow isShownWithAlertsOnly={!isBIP44} />
      <OriginRow />
      <SigningInWithRow />
    </ConfirmInfoSection>
  );
};
