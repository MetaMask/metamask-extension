import React from 'react';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { InternalAccount } from '@metamask/keyring-internal-api';

type SolanaAccountDetailsProps = {
  address: string;
  account: InternalAccount;
};

export const SolanaAccountDetails = ({ address, account }: SolanaAccountDetailsProps) => {

  return (
    <BaseAccountDetails address={address} account={account} />
  );
};