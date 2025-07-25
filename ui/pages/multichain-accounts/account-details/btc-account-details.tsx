import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';

type BitcoinAccountDetailsProps = {
  address: string;
  account: InternalAccount;
};

export const BitcoinAccountDetails = ({
  address,
  account,
}: BitcoinAccountDetailsProps) => {
  return <BaseAccountDetails address={address} account={account} />;
};
