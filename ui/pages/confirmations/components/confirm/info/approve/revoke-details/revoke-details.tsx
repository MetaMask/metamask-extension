import React from 'react';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { OriginRow } from '../../shared/transaction-details/transaction-details';
import { SigningInWithRow } from '../../shared/sign-in-with-row/sign-in-with-row';

export const RevokeDetails = () => {
  return (
    <ConfirmInfoSection>
      <OriginRow />
      <SigningInWithRow />
    </ConfirmInfoSection>
  );
};
