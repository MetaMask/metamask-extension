import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { SmartContractAccountToggleSection } from '../../../components/multichain-accounts/smart-contract-account-toggle-section';

type PrivateKeyAccountDetailsProps = {
  address: string;
  account: InternalAccount;
};

export const PrivateKeyAccountDetails = ({
  address,
  account,
}: PrivateKeyAccountDetailsProps) => {
  return (
    <BaseAccountDetails address={address} account={account}>
      <SmartContractAccountToggleSection address={address} />
    </BaseAccountDetails>
  );
};
