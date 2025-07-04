import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { AccountShowSrpRow } from '../../../components/multichain-accounts/account-show-srp-row/account-show-srp-row';
import { Box } from '../../../components/component-library';

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
      <Box className="multichain-account-details__section">
        <AccountShowSrpRow account={account} />
      </Box>
    </BaseAccountDetails>
  );
};
