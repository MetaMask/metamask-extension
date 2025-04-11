import { KeyringClient, Sender } from '@metamask/keyring-snap-client';
import { HandlerType } from '@metamask/snaps-utils';
import { CaipChainId, Json, JsonRpcRequest } from '@metamask/utils';
import { SnapId } from '@metamask/snaps-sdk';
import { useMemo } from 'react';
import {
  handleSnapRequest,
  multichainUpdateBalance,
  multichainUpdateTransactions,
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

export function useMultichainWalletSnapSender(snapId: SnapId) {
  const client = useMemo(() => {
    return new MultichainWalletSnapSender(snapId);
  }, [snapId]);

  return client;
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

  async createAccount(
    scope: CaipChainId,
    entropySource?: string,
    accountNameSuggestion?: string,
  ) {
    // This will trigger the Snap account creation flow (+ account renaming)
    const account = await this.#client.createAccount({
      scope,
      ...(entropySource ? { entropySource } : {}),
      ...(accountNameSuggestion ? { accountNameSuggestion } : {}),
    });

    // NOTE: The account's balance is going to be tracked automatically on when the new account
    // will be added to the Snap bridge keyring (see `MultichainBalancesController:#handleOnAccountAdded`).
    // However, the balance won't be fetched right away. To workaround this, we trigger the
    // fetch explicitly here (since we are already in a `async` call) and wait for it to be updated!
    await multichainUpdateBalance(account.id);
    // TODO: Remove this and the above line once Snap account creation flow is async
    await multichainUpdateTransactions(account.id);
  }
}

export function useMultichainWalletSnapClient(clientType: WalletClientType) {
  const client = useMemo(() => {
    return new MultichainWalletSnapClient(clientType);
  }, [clientType]);

  return client;
}
