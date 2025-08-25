import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { SmartContractAccountToggleSection } from '../../../components/multichain-accounts/smart-contract-account-toggle-section';
import { ACCOUNT_DETAILS_ROUTE } from '../../../helpers/constants/routes';
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
      <SmartContractAccountToggleSection
        address={address}
        returnToPage={ACCOUNT_DETAILS_ROUTE}
      />
    </BaseAccountDetails>
  );
};
