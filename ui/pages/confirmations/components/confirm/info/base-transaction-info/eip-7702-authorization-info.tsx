import React from 'react';
import {
  Authorization,
  AuthorizationList,
} from '@metamask/transaction-controller';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { RecipientRow } from '../shared/transaction-details/transaction-details';

export function EIP7702AuthorizationInfo({
  authorizationList,
}: {
  authorizationList?: AuthorizationList;
}) {
  if (!authorizationList) {
    return null;
  }

  return (
    <>
      {authorizationList.map((auth) => (
        <SingleInfo authorization={auth} />
      ))}
    </>
  );
}

function SingleInfo({ authorization }: { authorization: Authorization }) {
  return (
    <ConfirmInfoSection>
      <RecipientRow
        label="Delegates to"
        override={authorization.address}
        tooltip='This transaction includes an EIP-7702 authorization that will upgrade your account to use the smart contract at the specified address.'
      />
    </ConfirmInfoSection>
  );
}
