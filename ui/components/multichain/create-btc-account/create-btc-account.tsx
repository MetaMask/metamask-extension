import React from 'react';
import { InternalAccount, KeyringClient } from '@metamask/keyring-api';
import { useDispatch } from 'react-redux';
import { CreateAccount } from '..';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { BitcoinWalletSnapSender } from '../../../../app/scripts/lib/snap-keyring/bitcoin-wallet-snap';
import {
  setAccountLabel,
  forceUpdateMetamaskState,
} from '../../../store/actions';

type CreateBtcAccountOptions = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;
  /**
   * CAIP-2 chain ID
   */
  network: MultichainNetworks;
  /**
   * Default account name
   */
  defaultAccountName: string;
};

export const CreateBtcAccount = ({
  onActionComplete,
  defaultAccountName,
  network,
}: CreateBtcAccountOptions) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name: string) => {
    // Trigger the Snap account creation flow
    const client = new KeyringClient(new BitcoinWalletSnapSender());
    const account = await client.createAccount({
      scope: network,
    });

    // TODO: Use the new Snap account creation flow that also include account renaming
    // For now, we just use the AccountsController to rename the account after being created
    if (name) {
      // READ THIS CAREFULLY:
      // We have to update the redux state here, since we are updating the global state
      // from the background during account creation
      await forceUpdateMetamaskState(dispatch);

      // NOTE: If the renaming part of this flow fail, the account might still be created, but it
      // will be named according the Snap keyring naming logic (Snap Account N).
      dispatch(setAccountLabel(account.address, name));
    }

    await onActionComplete(true);
  };

  const getNextAvailableAccountName = async (_accounts: InternalAccount[]) => {
    return defaultAccountName;
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAvailableAccountName}
    ></CreateAccount>
  );
};
