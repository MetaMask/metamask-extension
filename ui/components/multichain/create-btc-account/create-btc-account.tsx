import React from 'react';
import { InternalAccount, KeyringClient, Sender } from '@metamask/keyring-api';
import { HandlerType } from '@metamask/snaps-utils';
import { Json, JsonRpcRequest } from '@metamask/utils';
import { handleSnapRequest } from '../../../store/actions';
import { CreateAccount } from '..';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BITCOIN_MANAGER_SCOPE_MAINNET,
  BITCOIN_MANAGER_SNAP_ID,
} from '../../../../shared/constants/bitcoin-manager-snap';

type CreateBtcAccountOptions = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;
};

class BitcoinSnapSender implements Sender {
  send = async (request: JsonRpcRequest): Promise<Json> => {
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: BITCOIN_MANAGER_SNAP_ID,
      // TODO: Remove this after integration is done
      // origin: 'https://metamask.github.io',
      // snapId: 'npm:@metamask/snap-simple-keyring-snap',
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}

export const CreateBtcAccount = ({
  onActionComplete,
}: CreateBtcAccountOptions) => {
  const onCreateAccount = async (_name: string) => {
    // We finish the current action to close the popup before starting the account creation.
    //
    // NOTE: We asssume that at this stage, name validation has already been validated so we
    // can safely proceed with the account Snap flow.
    await onActionComplete(true);

    const client = new KeyringClient(new BitcoinSnapSender());
    await client.createAccount({
      // TODO: Add constants for this
      scope: BITCOIN_MANAGER_SCOPE_MAINNET,
    });

    // TODO: Add logic to rename account
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
