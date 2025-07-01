import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { SmartContractAccountToggleSection } from '../../../components/multichain-accounts/smart-contract-account-toggle-section';
import { ACCOUNT_DETAILS_ROUTE } from '../../../helpers/constants/routes';

type EVMAccountDetailsProps = {
  address: string;
  account: InternalAccount;
};

export const EVMAccountDetails = ({
  address,
  account,
}: EVMAccountDetailsProps) => {
  return (
    <BaseAccountDetails address={address} account={account}>
      <SmartContractAccountToggleSection
        address={address}
        returnToPage={ACCOUNT_DETAILS_ROUTE}
      />
    </BaseAccountDetails>
  );
};
