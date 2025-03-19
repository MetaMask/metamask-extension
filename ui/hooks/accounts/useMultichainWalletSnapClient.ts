import { KeyringClient, Sender } from '@metamask/keyring-api';
import { HandlerType } from '@metamask/snaps-utils';
import { CaipChainId, Json, JsonRpcRequest } from '@metamask/utils';
import { SnapId } from '@metamask/snaps-sdk';
import { useMemo } from 'react';
import {
  handleSnapRequest,
  multichainUpdateBalance,
} from '../../store/actions';
import { BITCOIN_WALLET_SNAP_ID } from '../../../shared/lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../../shared/lib/accounts/solana-wallet-snap';

export enum WalletClientType {
  Bitcoin = 'bitcoin-wallet-snap',
  Solana = 'solana-wallet-snap',
}

const SNAP_ID_MAP: Record<WalletClientType, SnapId> = {
  [WalletClientType.Bitcoin]: BITCOIN_WALLET_SNAP_ID,
  [WalletClientType.Solana]: SOLANA_WALLET_SNAP_ID,
};

export class MultichainWalletSnapSender implements Sender {
  private snapId: SnapId;

  constructor(snapId: SnapId) {
    this.snapId = snapId;
  }

  send = async (request: JsonRpcRequest): Promise<Json> => {
    // We assume the caller of this module is aware of this. If we try to use this module
    // without having the pre-installed Snap, this will likely throw an error in
    // the `handleSnapRequest` action.
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: this.snapId,
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}

export class MultichainWalletSnapClient {
  readonly #client: KeyringClient;

  constructor(clientType: WalletClientType) {
    const snapId = SNAP_ID_MAP[clientType];
    if (!snapId) {
      throw new Error(`Unsupported client type: ${clientType}`);
    }
    this.#client = new KeyringClient(new MultichainWalletSnapSender(snapId));
  }

  async createAccount(scope: CaipChainId) {
    // This will trigger the Snap account creation flow (+ account renaming)
    const account = await this.#client.createAccount({
      scope,
    });

    // NOTE: The account's balance is going to be tracked automatically on when the new account
    // will be added to the Snap bridge keyring (see `BalancesController:#handleOnAccountAdded`).
    // However, the balance won't be fetched right away. To workaround this, we trigger the
    // fetch explicitly here (since we are already in a `async` call) and wait for it to be updated!
    await multichainUpdateBalance(account.id);
  }
}

export function useMultichainWalletSnapClient(clientType: WalletClientType) {
  const client = useMemo(() => {
    return new MultichainWalletSnapClient(clientType);
  }, [clientType]);

  return client;
}
