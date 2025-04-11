import React from 'react';

import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { NetworkRow } from '../../shared/network-row/network-row';
import { SigningInWithRow } from '../../shared/sign-in-with-row/sign-in-with-row';
import { OriginRow } from '../../shared/transaction-details/transaction-details';

export const RevokeDetails = () => {
  return (
    <ConfirmInfoSection>
      <NetworkRow isShownWithAlertsOnly />
      <OriginRow />
      <SigningInWithRow />
    </ConfirmInfoSection>
  );
};
