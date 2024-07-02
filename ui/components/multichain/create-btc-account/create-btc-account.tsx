import React from 'react';
import { InternalAccount, KeyringClient } from '@metamask/keyring-api';
import { useDispatch } from 'react-redux';
import { CreateAccount } from '..';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { BitcoinManagerSnapSender } from '../../../../app/scripts/lib/snap-keyring/bitcoin-manager-snap';
import { setAccountLabel } from '../../../store/actions';

type CreateBtcAccountOptions = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;
};

export const CreateBtcAccount = ({
  onActionComplete,
}: CreateBtcAccountOptions) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name: string) => {
    // Trigger the Snap account creation flow
    const client = new KeyringClient(new BitcoinManagerSnapSender());
    const account = await client.createAccount({
      scope: MultichainNetworks.BITCOIN,
    });

    // TODO: Use the new Snap account creation flow that also include account renaming
    // For now, we just use the AccountsController to rename the account after being created
    if (name) {
      // NOTE: If the renaming part of this flow fail, the account might still be created, but it
      // will be named according the Snap keyring naming logic (Snap Account N).
      dispatch(setAccountLabel(account.address, name));
    }

    await onActionComplete(true);
  };

  const getNextAvailableAccountName = async (_accounts: InternalAccount[]) => {
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
