import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';

type PrivateKeyAccountDetailsProps = {
  address: string;
  account: InternalAccount;
};

export const PrivateKeyAccountDetails = ({
  address,
  account,
}: PrivateKeyAccountDetailsProps) => {
  return <BaseAccountDetails address={address} account={account} />;
};
