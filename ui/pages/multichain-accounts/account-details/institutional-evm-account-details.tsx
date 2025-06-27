import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';

type InstitutionalEVMAccountDetailsProps = {
  address: string;
  account: InternalAccount;
};

export const InstitutionalEVMAccountDetails = ({
  address,
  account,
}: InstitutionalEVMAccountDetailsProps) => {
  return <BaseAccountDetails address={address} account={account} />;
};
