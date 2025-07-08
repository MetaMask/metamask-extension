import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { AccountShowPrivateKeyRow } from '../../../components/multichain-accounts/account-show-private-key-row/account-show-private-key-row';
import { Box } from '../../../components/component-library';

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
      <Box className="multichain-account-details__section">
        <AccountShowPrivateKeyRow account={account} />
      </Box>
    </BaseAccountDetails>
  );
};
