// TODO: remove when snap suggests account name during account creation event
import React from 'react';
import { InternalAccount } from '@metamask/keyring-api';
import { CreateAccount } from '..';
import { isBtcTestnetAddress } from '../../../../shared/lib/multichain';

type CreateBtcAccountOptions = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;
  /**
   * Callback to create the account.
   */
  onCreateAccount: (name: string) => Promise<void>;
  /**
   * Address of the new account
   */
  address: string;
};

export const CreateBtcAccount = ({
  onActionComplete,
  onCreateAccount,
  address,
}: CreateBtcAccountOptions) => {
  const getNextAvailableAccountName = async (_accounts: InternalAccount[]) => {
    if (isBtcTestnetAddress(address)) {
      return 'Bitcoin Testnet Account';
    }

    return 'Bitcoin Account';
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAvailableAccountName}
    ></CreateAccount>
  );
};
